import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../context/AuthContext';

// This hook will properly return the typed context
export const useAuth = (): AuthContextType => useContext(AuthContext);

export default useAuth;