// src/App.tsx
import "./App.css";
import {Link, Route, Routes, useNavigate} from "react-router-dom";
import {Button, Layout, Menu} from "antd";
import {ReportLasts} from "./components/Pages/ReportLasts.tsx";
import {TodayDeviceGraphsPage} from "./components/Pages/TodayDeviceGraphsPage.tsx";
import HomeCardsPage from "./components/Pages/HomePage/HomeCardsPage.tsx";
import {HomeOutlined, LogoutOutlined } from "@ant-design/icons";
import {RequireAuth} from "./auth/RequireAuth.tsx";
import RestrictedHome from "./components/RestrictedHome.tsx";
import {AuthCallback} from "./auth/AuthCallback.tsx";
import RestrictedTest from "./components/RestrictedTest.tsx";
import SimulationPage from "./components/Pages/SimulationPage.tsx";
import DeviceDatasourceDetailsPage from "./components/Pages/DeviceDatasourceDetailsPage.tsx";
import {useAuth} from "./auth/AuthContext.tsx";
const { Header, Content } = Layout;
const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === "false";

function App() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };
    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Header
                style={{
                    display: "flex",
                    alignItems: "center",
                    paddingInline: 16,
                }}
            >
                <Menu
                    theme="dark"
                    mode="horizontal"
                    selectable={false}
                    style={{ flex: 1 }}
                    items={[
                        {key: "home", icon: <HomeOutlined />,label: <Link to="/">Home</Link>},
                        { key: "dashboard", label: <Link to="/devicesoptic">Dashboard by Device</Link> },
                        { key: "remotedata", label: <Link to="/remotedata">DataSources</Link> },
                        { key: "simul", label: <Link to="/simul">Time Series Simulation</Link> },
                    ]}
                />
                {!AUTH_DISABLED && (
                    <Button
                        type="text"
                        icon={<LogoutOutlined />}
                        onClick={handleLogout}
                        style={{ color: "#fff", marginLeft: 16 }}
                    >
                        Logout
                    </Button>
                )}
            </Header>

            <Content style={{ padding: 20 }}>
                <Routes>
                    <Route path="/" element={<HomeCardsPage page="remotedatalive"/>} />
                    <Route path="/simul" element={<SimulationPage />} />

                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route element={<RequireAuth />}>
                        <Route path="/restricted" element={<RestrictedHome />} />
                        <Route path="/restricted/test" element={<RestrictedTest />} />
                        <Route path="/reportlasts" element={<ReportLasts />} />
                        <Route path="/devicesoptic" element={<TodayDeviceGraphsPage />} />
                        <Route path="/remotedata" element={<DeviceDatasourceDetailsPage />} />

                    </Route>
                </Routes>

            </Content>
        </Layout>
    );
}

export default App;