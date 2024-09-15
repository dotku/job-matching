import { MainLayout } from "./components/layouts";
import HMCYIndex, {
  HMCYEDoordash,
  HMCYEDoordashFullTime,
} from "./page/HowMuchCanYouEarn";
import HowMuchYouCanEarnHome from "./page/HowMuchCanYouEarn/HMCYEHome";

const routes = [
  {
    layout: MainLayout,
  },
  {
    path: `/how-much-can-you-earn/`,
    component: HMCYIndex,
    routes: [
      {
        name: "How Much DoorDash Drivers Make in 2024: A 6 Years Doodarsher Shared His Formular for the Actually Earning!",
        path: `/how-much-can-you-earn/doordash-full-time`,
        component: HMCYEDoordashFullTime,
      },
      {
        name: "Taking Every Doordash Order For 24 Hours Straight: How much I can earn from Doordash in 2024?",
        path: `/how-much-can-you-earn/doordash`,
        component: HMCYEDoordash,
      },
    ],
  },
];

export default routes;
