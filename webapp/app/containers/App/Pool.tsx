export interface Pool {
  address: string;
  name: string;
  type: string;
  period: number;
  cap: number;
  participants: number;
  interestRate: number;
}
