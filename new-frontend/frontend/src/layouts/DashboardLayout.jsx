// import Header from '../components/Header';
// import Footer from '../components/Footer';
// import SideNav from '../components/SideNav';

const DashboardLayout = ({ children }) => (
  <div className="dashboard-layout">
    {/* <Header /> */}
    {/* <SideNav /> */}
    <main>{children}</main>
    {/* <Footer /> */}
  </div>
);

export default DashboardLayout;
