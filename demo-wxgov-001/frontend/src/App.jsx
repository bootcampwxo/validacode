import React, { Suspense, lazy } from 'react';
import {
  Header, HeaderContainer, HeaderName, HeaderNavigation, HeaderMenuItem,
  HeaderGlobalBar, HeaderGlobalAction, SideNav, SideNavItems,
  SideNavMenuItem, SkipToContent, HeaderMenuButton, Loading, Content,
} from '@carbon/react';
import {
  Analytics, ReportData, Security, ChartMultitype,
  WatsonHealthAiResults, Notification, UserAvatar, Switcher,
  NetworkEnterprise,
} from '@carbon/icons-react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import DemoBanner from './components/DemoBanner';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const GovernancePage = lazy(() => import('./pages/GovernancePage'));
const AgentOpsPage = lazy(() => import('./pages/AgentOpsPage'));
const ComplaintsPage = lazy(() => import('./pages/ComplaintsPage'));
const ArchitecturePage = lazy(() => import('./pages/ArchitecturePage'));
const AgentChatPage = lazy(() => import('./pages/AgentChatPage'));
const ModelLifecyclePage = lazy(() => import('./pages/ModelLifecyclePage'));

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: Analytics },
  { label: 'AI Governance', path: '/governance', icon: Security },
  { label: 'Model Lifecycle', path: '/lifecycle', icon: ReportData },
  { label: 'AgentOps Traces', path: '/agentops', icon: WatsonHealthAiResults },
  { label: 'Complaints', path: '/complaints', icon: ChartMultitype },
  { label: 'Live Agent Chat', path: '/agent-chat', icon: ChartMultitype },
  { label: 'Architecture', path: '/architecture', icon: NetworkEnterprise },
];

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <SideNavMenuItem
      element={Link}
      to={to}
      isActive={active}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </SideNavMenuItem>
  );
}

export default function App() {
  return (
    <HeaderContainer
      render={({ isSideNavExpanded, onClickSideNavExpand }) => (
        <>
          <Header aria-label="AI Governance + AgentOps — Built with IBM watsonx">
            <SkipToContent />
            <HeaderMenuButton
              aria-label={isSideNavExpanded ? 'Close menu' : 'Open menu'}
              onClick={onClickSideNavExpand}
              isActive={isSideNavExpanded}
            />
            <HeaderName element={Link} to="/" prefix="IBM">
              watsonx Governance + AgentOps
            </HeaderName>
            <HeaderNavigation aria-label="Main navigation">
              {NAV_ITEMS.map((item) => (
                <HeaderMenuItem key={item.path} element={Link} to={item.path}>
                  {item.label}
                </HeaderMenuItem>
              ))}
            </HeaderNavigation>
            <HeaderGlobalBar>
              <HeaderGlobalAction aria-label="Notifications">
                <Notification size={20} />
              </HeaderGlobalAction>
              <HeaderGlobalAction aria-label="User profile">
                <UserAvatar size={20} />
              </HeaderGlobalAction>
              <HeaderGlobalAction aria-label="App switcher">
                <Switcher size={20} />
              </HeaderGlobalAction>
            </HeaderGlobalBar>
            <SideNav
              aria-label="Side navigation"
              expanded={isSideNavExpanded}
              isPersistent={false}
            >
              <SideNavItems>
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.path} to={item.path}>
                    {item.label}
                  </NavLink>
                ))}
              </SideNavItems>
            </SideNav>
          </Header>

          <Content>
            <DemoBanner />
            <Suspense fallback={<Loading description="Loading page..." withOverlay={false} />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/governance" element={<GovernancePage />} />
                <Route path="/agentops" element={<AgentOpsPage />} />
                <Route path="/complaints" element={<ComplaintsPage />} />
                <Route path="/lifecycle" element={<ModelLifecyclePage />} />
                <Route path="/agent-chat" element={<AgentChatPage />} />
                <Route path="/architecture" element={<ArchitecturePage />} />
              </Routes>
            </Suspense>
          </Content>
        </>
      )}
    />
  );
}
