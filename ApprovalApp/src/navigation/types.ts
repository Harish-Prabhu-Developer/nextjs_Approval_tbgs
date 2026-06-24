export type RootStackParamList = {
  Login: undefined;
  App: undefined;
  ViewDetail: { id: any; approvalType: string; item: any };
};

export type DrawerParamList = {
  Dashboard: undefined;
  SubModule: { parentId: number; title: string };
  ViewDetail: { id: any; approvalType: string; item: any };
  ChatList: undefined;
  ChatDetail: { userId: number; name: string };
  [key: string]: any;
};
