import { Route, Routes, Navigate } from "react-router-dom";
import About from "./About.jsx";
import AccountSettings from "./AccountSettings.jsx";
import Dashboard from "./Dashboard.jsx";
import Home from "./Home.jsx";
import Login from "./Login.jsx";
import ResetPassword from "./ResetPassword.jsx";
import Reviews from "./Reviews.jsx";
import ReviewDetail from "./ReviewDetail.jsx";
import Articles from "./Articles.jsx";
import ArticleDetail from "./ArticleDetail.jsx";
import Quiz from "./Quiz.jsx";
import WineList from "./WineList.jsx";
import WineDetail from "./WineDetail.jsx";
import WineForm from "./WineForm.jsx";
import WineSearch from "./WineSearch.jsx";
import ProducerList from "./ProducerList.jsx";
import ProducerDetail from "./ProducerDetail.jsx";
import ProducerForm from "./ProducerForm.jsx";
import ProducerWines from "./ProducerWines.jsx";
import UserRoles from "./UserRoles.jsx";
import Categories from "./Categories.jsx";
import CategoryDetail from "./CategoryDetail.jsx";
import Grapes from "./Grapes.jsx";
import GrapeDetail from "./GrapeDetail.jsx";
import GrapeWines from "./GrapeWines.jsx";
import GrapeProducers from "./GrapeProducers.jsx";
import Countries from "./Countries.jsx";
import CountryDetail from "./CountryDetail.jsx";
import Regions from "./Regions.jsx";
import RegionDetail from "./RegionDetail.jsx";
import ApiHealth from "./ApiHealth/ApiHealth.jsx";
import Subscribe from "./Subscribe.jsx";
import SubscriptionAdmin from "./SubscriptionAdmin.jsx";
import Logs from "./Logs.jsx";
import LogDetail from "./LogDetail.jsx";

function AppRoutes({ user, setUser }) {
  return (
    <>
      <Routes>
        <Route element={<AccountSettings />} path="/account" />
        <Route element={<Dashboard />} path="/" />
        <Route element={<Home />} path="/finder" />
        <Route element={<Quiz />} path="quiz" />
        <Route element={<About />} path="about" />
        <Route
          path="/login"
          element={<Login user={user} setUser={setUser} />}
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<Navigate replace to="/reviews" />} path="/my-reviews" />
        <Route element={<Reviews />} path="/reviews" />
        <Route element={<ReviewDetail />} path="/reviews/:slug" />
        <Route element={<Articles />} path="/articles" />
        <Route element={<ArticleDetail />} path="/articles/:slug" />
        <Route element={<ArticleDetail />} path="/articles/:slug/edit" />
        <Route element={<WineSearch />} path="/search" />
        <Route element={<WineList />} path="/wines" />
        <Route element={<WineDetail />} path="/wines/:slug" />
        <Route element={<WineForm />} path="/wines/new" />
        <Route element={<WineForm />} path="/wines/:slug/edit" />
        <Route element={<ProducerList />} path="/producers" />
        <Route element={<ProducerWines />} path="/producers/:slug/wines" />

        <Route element={<ProducerDetail />} path="/producers/:slug" />
        <Route element={<ProducerForm />} path="/producers/new" />
        <Route element={<ProducerForm />} path="/producers/:slug/edit" />
        <Route element={<UserRoles />} path="/users" />
        <Route element={<Categories />} path="/categories" />
        <Route element={<CategoryDetail />} path="/categories/:slug" />
        <Route element={<Grapes />} path="/grapes" />
        <Route element={<GrapeDetail />} path="/grapes/:slug" />
        <Route element={<GrapeWines />} path="/grapes/:slug/wines" />
        <Route element={<GrapeProducers />} path="/grapes/:slug/producers" />
        <Route element={<Countries />} path="/countries" />
        <Route element={<CountryDetail />} path="/countries/:slug" />
        <Route element={<Regions />} path="/regions" />
        <Route element={<RegionDetail />} path="/regions/:slug" />
        <Route element={<ApiHealth />} path="/admin/api-health" />
        <Route element={<Subscribe />} path="/subscribe" />
        <Route element={<SubscriptionAdmin />} path="/subscriptions" />
        <Route element={<Logs />} path="/admin/logs" />
        <Route element={<LogDetail />} path="/admin/logs/:id" />
      </Routes>
    </>
  );
}

export default AppRoutes;
