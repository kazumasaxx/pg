export type CategorySetting = {
  id: string;
  name: string;
  created_at: string;
};

export type StoreDefaultCategory = {
  id: string;
  store_keyword: string;
  category_id: string;
  created_at: string;
  category_settings: CategorySetting;
};

export type ReimbursementType = {
  id: string;
  name: string;
  is_positive: boolean;
  created_at: string;
};

export type ReimbursementUser = {
  id: string;
  username: string;
  created_at: string;
};

export type ItemValue = {
  id: string;
  date: string;
  vendor: string;
  jan_code: string;
  item_name: string;
  price: number;
  created_at: string;
};