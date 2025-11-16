import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../redux/user/userSlice.js';
import GoogleAuth from '../components/GoogleAuth.jsx';

export default function SignInPage() {

  const [formData, setFormData] = useState({});
  const { currentUser, loading, error: errorMessage } = useSelector(state => state.user);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard?tab=profile');
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return dispatch(signInFailure('Please fill out all fields!'));
    }
    try {
      dispatch(signInStart());
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success === false) {
        return dispatch(signInFailure(data.message));
      }

      if (res.ok) {
        dispatch(signInSuccess(data));
        navigate('/');
      }

    } catch (error) {
      dispatch(signInFailure(error.message));
    }
  };

  return (
    <div className='min-h-screen mt-20 relative isolate'>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0"
      >
        <div
          style={{
            clipPath:
              'polygon(55% 10%, 100% 30%, 100% 100%, 90% 30%, 85% 40%, 75% 35%, 65% 45%, 55% 40%, 45% 50%, 35% 45%, 25% 55%, 15% 50%, 5% 60%, 0% 55%, 0% 100%, 10% 90%, 20% 95%, 30% 85%, 40% 90%, 50% 80%, 60% 85%, 70% 75%, 80% 80%, 90% 70%, 100% 75%, 100% 100%, 0% 100%)',
          }}
          className="relative left-[calc(50%-5rem)] aspect-[1155/678] w-[48rem] -translate-x-96 rotate-[300deg] bg-gradient-to-tr from-[#d528f7] to-[#0ed481] opacity-40 sm:left-[calc(50%-20rem)] sm:w-[80rem] animate-pulse"
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
                placeholder='**********'
                id='password' onChange={handleChange}
                helperText={
                  <>
                    We'll never share your details. Read our
                    <a href="#" className="ml-1 font-medium text-cyan-600 hover:underline dark:text-cyan-500">
                      Privacy Policy
                    </a>
                    .
                  </>
                } />
            </div>
            <Button gradientDuoTone='purpleToPink' type='submit' disabled={loading}>{
              loading ? (
                <>
                  <Spinner size='sm' />
                  <span className='pl-3'>Loading...</span>
                </>
              ) : 'Sign In'}
            </Button>
            <GoogleAuth />
          </form>
          <div className='flex gap-2 text-sm mt-5'>
            <span>Don't have an account?</span>
            <Link to='/sign-up' className='text-blue-500'>Sign Up</Link>
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
