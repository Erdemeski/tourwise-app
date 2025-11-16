import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GoogleAuth from '../components/GoogleAuth';
import { useSelector } from 'react-redux';

export default function SignUpPage() {

  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { currentUser } = useSelector(state => state.user);

  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard?tab=profile');
    }
  }, [currentUser, navigate]);

  const validateForm = () => {
    const errors = {};
    if (formData.firstName && formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters long';
    }
    if (formData.lastName && formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters long';
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      return setErrorMessage('Please fill out all fields!');
    }
    if (!validateForm()) {
      return setErrorMessage('Please fix the validation errors');
    }
    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success === false) {
        return setErrorMessage(data.message);
      }

      setLoading(false);

      if (res.ok) {
        navigate('/sign-in');
      }

    } catch (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen mt-20 relative isolate'>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0 rotate-180"
      >
        <div
          style={{
            clipPath:
              'polygon(5% 10%, 100% 30%, 100% 100%, 50% 30%, 5% 40%, 5% 35%, 5% 45%, 55% 40%, 5% 0%, 35% 45%, 25% 55%, 15% 50%, 95% 60%, 0% 55%, 0% 100%, 10% 90%, 20% 95%, 30% 85%, 40% 90%, 50% 80%, 60% 85%, 70% 75%, 80% 80%, 200% 70%, 10% 75%, 100% 100%, 0% 100%)',
          }}
          className="relative left-[calc(50%-5rem)] aspect-[1155/678] w-[48rem] -translate-x-1/4 rotate-[25deg] bg-gradient-to-tr from-[#f728db] to-[#0adabe] opacity-40 sm:left-[calc(50%-20rem)] sm:w-[80rem] animate-pulse"
        />
      </div>
      <div className='flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5'>
      <div className='flex-1'>
          <div className='text-4xl sm:text-5xl dark:text-white self-center whitespace-nowrap focus:outline-none focus:ring-0 font-brand'>
            <span className='pl-1.5 pr-1.5 mr-1 py-1 bg-gradient-to-r from-blue-500 via-teal-400 to-cyan-400 rounded-lg text-white'>Tour</span>
            <span className=''>wise</span>
          </div>
          <p className='text-sm mt-5'>
            To explore and create routes, you can sign in with your email and password or with your Google account.
          </p>
        </div>
        <div className='flex-1'>
          <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            <div className='flex gap-4 w-full'>
              <div className='w-1/2'>
                <Label value='Your first name' />
                <TextInput
                  type='text'
                  placeholder='First name'
                  id='firstName'
                  onChange={handleChange} />
                {validationErrors.firstName && (
                  <span className='text-red-500 text-sm'>{validationErrors.firstName}</span>
                )}
              </div>
              <div className='w-1/2'>
                <Label value='Your last name' />
                <TextInput
                  type='text'
                  placeholder='Last name'
                  id='lastName'
                  onChange={handleChange} />
                {validationErrors.lastName && (
                  <span className='text-red-500 text-sm'>{validationErrors.lastName}</span>
                )}
              </div>
            </div>
            <div>
              <Label value='Your username' />
              <TextInput
                type='text'
                placeholder='Username'
                id='username' onChange={handleChange} />
            </div>
            <div>
              <Label value='Your email' />
              <TextInput
                type='email'
                placeholder='Email'
                id='email' onChange={handleChange} />
            </div>
            <div>
              <Label value='Your password' />
              <TextInput
                type='password'
                placeholder='password'
                id='password' 
                onChange={handleChange}
                helperText={
                  <>
                    We'll never share your details. Read our
                    <a href="#" className="ml-1 font-medium text-cyan-600 hover:underline dark:text-cyan-500">
                      Privacy Policy
                    </a>
                    .
                  </>
                } />
              {validationErrors.password && (
                <span className='text-red-500 text-sm'>{validationErrors.password}</span>
              )}
            </div>
            <Button gradientDuoTone='purpleToPink' type='submit' disabled={loading}>{
              loading ? (
                <>
                  <Spinner size='sm' />
                  <span className='pl-3'>Loading...</span>
                </>
              ) : 'Sign Up'}
            </Button>
            <GoogleAuth />
          </form>
          <div className='flex gap-2 text-sm mt-5'>
            <span>Have an account?</span>
            <Link to='/sign-in' className='text-blue-500'>Sign In</Link>
          </div>
          {
            errorMessage && (
              <Alert className='my-5' color='failure'>
                {errorMessage}
              </Alert>
            )
          }
        </div>
      </div>
    </div>
  );
}
