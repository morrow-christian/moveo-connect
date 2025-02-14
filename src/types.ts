
export interface Move {
  id: string;
  created_at: string;
  start_date: string;
  end_date: string;
  status: string;
  move_type: string;
  from_address: string | null;
  to_address: string | null;
  description: string | null;
  title: string;
  client_id: string;
  parent_move_id: string | null;
  is_subtask: boolean;
  clients: {
    first_name: string;
    last_name: string;
  };
}
