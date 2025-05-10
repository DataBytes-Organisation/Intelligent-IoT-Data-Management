import { useState } from 'react'
import './Register.css'

const Register = () => {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            throw new Error("Passwords must match")
        }
        
    }

    return (
        <div className="register">
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="firstName">First Name</label>
                <input 
                    id="firstName"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                ></input>
                <label htmlFor="lastName">Last Name</label>
                <input 
                    id="lastName"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                ></input>
                <label htmlFor="email">Email</label>
                <input 
                    id="email" 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                ></input>
                <label htmlFor="password">Password</label>
                <input 
                    id="password" 
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                ></input>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input 
                    id="confirmPassword" 
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                ></input>
                <button type="submit">Register</button>
            </form>
            <p>Already have an account? Login here:</p>
            <a href="/login">Login</a>
        </div>
    )
}

export default Register