export type RootStackParamList = {
  Login: undefined;
  App: undefined;
  ViewDetail: { id: any; approvalType: string; item: any };
};

export type DrawerParamList = {
  Dashboard: undefined;
  PurchaseOrder: { title: string; subtitle?: string; routeSlug: string };
  WorkOrder: { title: string; subtitle?: string; routeSlug: string };
  PriceApproval: { title: string; subtitle?: string; routeSlug: string };
  SalesReturn: { title: string; subtitle?: string; routeSlug: string };
  ViewDetail: { id: any; approvalType: string; item: any };
  ChatList: undefined;
  ChatDetail: { userId: number; name: string };
};
