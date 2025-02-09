
export interface Move {
  id: string;
  created_at: string;
  start_date: string;
  status: string;
  move_type: string;
  from_address: string;
  clients: {
    first_name: string;
    last_name: string;
  };
}
