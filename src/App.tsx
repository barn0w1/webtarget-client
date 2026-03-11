import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useWords } from './hooks/useWords';
import LoadingScreen from './screens/LoadingScreen';
import ErrorScreen from './screens/ErrorScreen';
import SetupScreen from './screens/SetupScreen';
import PracticeScreen from './screens/PracticeScreen';
import ResultsScreen from './screens/ResultsScreen';

export default function App() {
  const { words, loading, error } = useWords();

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SetupScreen words={words!} />} />
        <Route path="/practice" element={<PracticeScreen words={words!} />} />
        <Route path="/results" element={<ResultsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
