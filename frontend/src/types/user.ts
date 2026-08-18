export interface User {
  userid: number;
  username: string;
  password: string;
  role: "adimn" | "guest" | "orginiser" | "participant";
  approved: boolean;
  name: string;
  surename: string;
  email: string;
  telephone: number;
  address: string;
  taxNumber: string;
}
