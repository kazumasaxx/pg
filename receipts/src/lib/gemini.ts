import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('Missing Gemini API key');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function saveVendorCategory(vendor: string, categoryName: string) {
  try {
    // Get category ID from category_settings
    const { data: category } = await supabase
      .from('category_settings')
      .select('id')
      .eq('name', categoryName)
      .single();

    if (!category) return;

    // Extract the main part of the vendor name (first few words)
    const vendorKeyword = vendor.split(/[\s,]/)[0].trim();
    if (!vendorKeyword) return;

    // Check if mapping already exists for this vendor keyword
    const { data: existingMapping } = await supabase
      .from('store_default_category')
      .select('id')
      .ilike('store_keyword', vendorKeyword)
      .single();

    if (existingMapping) return; // Skip if mapping exists

    // Save new mapping
    await supabase.from('store_default_category').insert({
      store_keyword: vendorKeyword,
      category_id: category.id
    });
  } catch (error) {
    console.error('Error saving vendor category:', error);
  }
}

export async function findDefaultCategory(vendor: string): Promise<string | null> {
  const { data: storeDefaults } = await supabase
    .from('store_default_category')
    .select(`
      store_keyword,
      category_settings (
        name
      )
    `);

  if (!storeDefaults) return null;

  for (const def of storeDefaults) {
    if (vendor.toLowerCase().includes(def.store_keyword.toLowerCase())) {
      return def.category_settings.name;
    }
  }

  return null;
}

async function searchProductInfo(janCode: string): Promise<{ name: string; price: number } | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      以下のJANコードの商品について、商品名と一般的な価格を教えてください。
      JANコード: ${janCode}

      以下の形式でJSON形式で返してください：
      {
        "name": "商品名",
        "price": 価格（数値のみ）
      }

      注意:
      - 商品が見つからない場合は null を返してください
      - 価格は数値のみ（円マーク等は不要）
      - できるだけ正確な情報を提供してください
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse product info response:', e);
      return null;
    }
  } catch (error) {
    console.error('Error searching product info:', error);
    return null;
  }
}

async function saveItemValue(date: string, vendor: string, janCode: string, itemName: string, price: number) {
  try {
    const { error } = await supabase.from('item_values').insert({
      date,
      vendor,
      jan_code: janCode,
      item_name: itemName,
      price,
    });

    if (error) {
      if (error.code === '23505') { // Unique violation
        console.log('Item value already exists for this date');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error saving item value:', error);
    throw error;
  }
}

export async function analyzeReceipt(imageBase64: string): Promise<{
  date: string;
  vendor: string;
  category: string;
  amount: string;
  janCodes?: { code: string; price: number }[];
}> {
  try {
    // Get available categories from Supabase
    const { data: categories, error: categoriesError } = await supabase
      .from('category_settings')
      .select('name')
      .order('name');

    if (categoriesError) {
      throw new Error('カテゴリーの取得に失敗しました');
    }

    const categoryList = categories.map(c => c.name).join(', ');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      この画像は領収書です。以下の情報を抽出してJSON形式で返してください：
      - date: 日付 (YYYY-MM-DD形式)
      - vendor: 取引先の名前
      - category: 勘定科目 (${categoryList})
      - amount: 金額 (数値のみ)
      - janCodes: JANコードと価格の配列 (見つかった場合のみ)
        - code: JANコード
        - price: その商品の価格

      例:
      {
        "date": "2024-03-21",
        "vendor": "株式会社サンプル",
        "category": "消耗品費",
        "amount": "1000",
        "janCodes": [
          {"code": "4901234567890", "price": 108},
          {"code": "4901234567891", "price": 892}
        ]
      }

      注意:
      - 日付は必ずYYYY-MM-DD形式で
      - 金額は数字のみを抽出、カンマや円マークは除外
      - カテゴリーは選択肢から最も近いもの
      - 正式名称で取引先名を抽出
      - JANコードが見つからない場合は janCodes フィールドを含めない
    `;

    // Base64文字列から画像データを作成
    const mimeType = imageBase64.startsWith('data:image/png;') ? 'image/png' : 'image/jpeg';
    const imageData = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/(png|jpeg);base64,/, ''),
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();

    try {
      // Remove markdown code block formatting before parsing
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Find default category based on vendor name
      const defaultCategory = await findDefaultCategory(parsed.vendor);
      const category = defaultCategory || parsed.category || '';

      // If no default category exists and we got a category from OCR,
      // save this new vendor-category mapping
      if (!defaultCategory && parsed.category) {
        await saveVendorCategory(parsed.vendor, parsed.category);
      }

      // If JANコードが見つかった場合、商品情報を検索して保存
      if (parsed.janCodes && Array.isArray(parsed.janCodes)) {
        for (const item of parsed.janCodes) {
          const productInfo = await searchProductInfo(item.code);
          if (productInfo) {
            await saveItemValue(
              parsed.date,
              parsed.vendor,
              item.code,
              productInfo.name,
              item.price
            );
          }
        }
      }

      return {
        date: parsed.date || '',
        vendor: parsed.vendor || '',
        category,
        amount: parsed.amount?.toString() || '',
        janCodes: parsed.janCodes,
      };
    } catch (e) {
      console.error('Failed to parse Gemini response:', e);
      console.error('Raw response:', text);
      throw new Error('領収書の解析に失敗しました');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('領収書の解析に失敗しました');
  }
}