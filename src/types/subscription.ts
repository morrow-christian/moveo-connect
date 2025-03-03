
export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'monthly' | 'annual';
  status: 'active' | 'canceled' | 'past_due';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
}
