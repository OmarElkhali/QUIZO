import { Navigate, useParams } from 'react-router-dom';

export default function JoinQuiz() {
  const { shareCode } = useParams();
  return <Navigate replace to={shareCode ? '/join/' + encodeURIComponent(shareCode) : '/join'} />;
}
