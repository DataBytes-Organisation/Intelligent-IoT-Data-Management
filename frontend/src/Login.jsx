import { useState } from 'react'
import './Login.css'

const Login = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [resetEmail, setResetEmail] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)

    //When submitting on login screen...
   const handleSubmit = async (e) => {
        e.preventDefault()

        console.log('Email: ', email)
        console.log('Password: ', password)
        
        //Fetch user details from DB
        const response = await fetch()


    }

    const handleForgottenPasswordOverlay = () => {
        setIsModalOpen(true);
    }

    const handleForgottenPasswordClose = () => {
        setIsModalOpen(false);
    }

    const handleForgottenPasswordSubmit = async (e) => {
        e.preventDefault();
        console.log("Password reset request for:", email)
        setIsModalOpen(false);
    }

    return (
        <div>
            <div className="login">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Email</label>
                        <input 
                            id="email" 
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        ></input>
                    </div>
                    <div>
                        <label htmlFor="password">Password</label>
                        <input 
                            id="password" 
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        ></input>
                    </div>
                    <button type="submit">Login</button>
                    <div>
                        <a className="centeredLinkWrapper" href="#" onClick={handleForgottenPasswordOverlay}>Forgotten password?</a>
                    </div>
                </form>
                <p>No account? Please register here:</p>
                <a href="/register">Register</a>
            </div>

            {isModalOpen && (
                <div className="modalOverlay">
                    <div className="modal">
                        <span className="closeButton" onClick={handleForgottenPasswordClose}>&times;</span>
                        <form onSubmit={handleForgottenPasswordSubmit}>
                            <h2>Reset Password</h2>
                            <label htmlFor="resetEmail">Email</label>
                            <input 
                                id="resetEmail" 
                                type="email"
                                value={resetEmail}
                                onChange={e => setResetEmail(e.target.value)}
                            ></input>
                            <button className="button" type="submit">Reset password</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Login