export type RootStackParamList = {
  Login: undefined;
  App: undefined;
  ViewDetail: { id: any; approvalType: string; item: any };
};

export type DrawerParamList = {
  Dashboard: undefined;
  ViewDetail: { id: any; approvalType: string; item: any };
  ChatList: undefined;
  ChatDetail: { userId: number; name: string };
  [key: string]: any;
};
