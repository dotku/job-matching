import { MainLayout } from "./components/layouts";
import HMCYIndex, {
  HMCYEDoordash,
  HMCYEDoordashFullTime,
  HMCYESF40K,
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
        name: "What Kind Part Time Job Can Help You Making for 40 K Annually in San Francisco?",
        path: "/how-much-can-you-earn/what-kind-part-time-job-can-help-you-making-for-40k-annually-in-san-francisco",
        component: HMCYESF40K,
      },
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
