import {createContext, PropsWithChildren, useState} from 'react';

interface AuthContextType {
    isConnected: boolean;
    email: string;
    updateEmail: (email: string) => void;
    login: (email: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    isConnected: false,
    email: '',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    login: (_email: string) => {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateEmail: (_email: string) => {},
    logout: () => {}
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const [isConnected, setIsConnected] = useState(false);
    const [email, setEmail] = useState('');

    const login = (email: string | undefined) => {
        if (email !== undefined) {
            setIsConnected(true);
            setEmail(email);
        }
    };

    const logout = () => {
        setIsConnected(false);
        setEmail('');
        localStorage.removeItem('token');
    };

    const authContextValue: AuthContextType = {
        isConnected,
        email,
        updateEmail: setEmail,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};
