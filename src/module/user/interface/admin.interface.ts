export interface NewAdminInfo {
  id: string;
  adminName: string;
  adminEmail: string;
  adminGradeIdx: number;
}

export interface UpdateAdminInfo extends Partial<NewAdminInfo> {}
