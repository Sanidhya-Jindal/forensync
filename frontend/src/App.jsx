import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ReportUnidentifiedBody from './pages/ReportUnidentifiedBody';
import ReportMissingPerson from './pages/ReportMissingPerson';
import SearchMatch from './pages/SearchMatch';
import Records from './pages/Records';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="report-unidentified-body" element={<ReportUnidentifiedBody />} />
        <Route path="report-missing-person" element={<ReportMissingPerson />} />
        <Route path="search-match" element={<SearchMatch />} />
        <Route path="records" element={<Records />} />
      </Route>
    </Routes>
  );
}

export default App;
