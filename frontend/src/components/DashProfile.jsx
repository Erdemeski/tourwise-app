import { Alert, Button, Label, Modal, TextInput } from 'flowbite-react'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { app } from '../firebase'
import { updateStart, updateSuccess, updateFailure, deleteUserStart, deleteUserSuccess, deleteUserFailure, signoutSuccess } from '../redux/user/userSlice.js';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { FiAlertCircle } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

const fadeInStyle = `
@keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .fade-in {
    animation: fadeIn 1s ease-in forwards;
  }
  `;


export default function DashProfile() {

    const { currentUser, error, loading } = useSelector(state => state.user);
    const [imageFile, setImageFile] = useState(null);
    const [imageFileUrl, setImageFileUrl] = useState(null);
    const [imageUploadProgress, setImageUploadProgress] = useState(null);
    const [imageUploadError, setImageUploadError] = useState(null);
    const [imageFileUploading, setImageFileUploading] = useState(false);
    const [updateUserSuccess, setUpdateUserSuccess] = useState(null);
    const [updateUserError, setUpdateUserError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showSignout, setShowSignout] = useState(false);
    const [formData, setFormData] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const dispatch = useDispatch();
    const filePickerRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        // Add the styles to the document
        const styleSheet = document.createElement("style");
        styleSheet.innerText = fadeInStyle;
        document.head.appendChild(styleSheet);

        return () => {
            // Cleanup: remove the style when component unmounts
            document.head.removeChild(styleSheet);
        };
    }, []);


    const validateForm = () => {
        const errors = {};
        if (formData.firstName && formData.firstName.length < 2) {
            errors.firstName = 'First name must be at least 2 characters long';
        }
        if (formData.lastName && formData.lastName.length < 2) {
            errors.lastName = 'Last name must be at least 2 characters long';
        }
        if (formData.password && !formData.currentPassword) {
            errors.currentPassword = 'Please enter your current password to set a new one';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImageFileUrl(URL.createObjectURL(file));
        }
    };

    useEffect(() => {
        if (imageFile) {
            uploadImage();
        }
    }, [imageFile]);

    const uploadImage = async () => {
        setImageFileUploading(true);
        setImageUploadError(null);
        const storage = getStorage(app);
        const fileName = new Date().getTime() + imageFile.name;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setImageUploadProgress(progress.toFixed(0));
            },
            (error) => {
                setImageUploadError('Image could not upload (It must be an image file less than 2MB)');
                setImageUploadProgress(null);
                setImageFile(null);
                setImageFileUrl(null);
                setImageFileUploading(false);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setImageFileUrl(downloadURL);
                    setFormData({ ...formData, profilePicture: downloadURL });
                    setImageFileUploading(false);
                });
            }
        );
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdateUserError(null);
        setUpdateUserSuccess(null);

        // Clear password fields after every submission attempt
        const currentPasswordInput = document.getElementById('currentPassword');
        const newPasswordInput = document.getElementById('password');
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';

        if (Object.keys(formData).length === 0) {
            setUpdateUserError('Nothing has changed');
            return;
        }
        if (imageFileUploading) {
            setUpdateUserError('Please wait for image uploading');
            return;
        }
        if (!validateForm()) {
            setUpdateUserError('Please fix the validation errors');
            return;
        }
        try {
            dispatch(updateStart());
            const res = await fetch(`/api/user/update/${currentUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) {
                dispatch(updateFailure(data.message));
                setUpdateUserError(data.message);
                // Clear form data if there's an error
                setFormData(prev => ({
                    ...prev,
                    password: '',
                    currentPassword: ''
                }));
            }
            else {
                dispatch(updateSuccess(data));
                setUpdateUserSuccess("Profile has been updated successfuly");
                // Clear all form data after successful update
                setFormData({});
                // Reset text inputs to their default values
                const firstNameInput = document.getElementById('firstName');
                const lastNameInput = document.getElementById('lastName');
                if (firstNameInput) firstNameInput.value = data.firstName;
                if (lastNameInput) lastNameInput.value = data.lastName;
            }
        } catch (error) {
            dispatch(updateFailure(error.message));
            setUpdateUserError(error.message);
            // Clear form data if there's an error
            setFormData(prev => ({
                ...prev,
                password: '',
                currentPassword: ''
            }));
        }
    };

    const handleDeleteUser = async () => {
        setShowModal(false);
        try {
            dispatch(deleteUserStart());
            const res = await fetch(`/api/user/delete/${currentUser._id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) {
                dispatch(deleteUserFailure(data.message));
            } else {
                dispatch(deleteUserSuccess(data));
            }
        } catch (error) {
            dispatch(deleteUserFailure(error.message));
        }
    };

    const handleSignout = async () => {
        try {
            const res = await fetch('/api/user/signout', {
                method: 'POST',
            });
            const data = await res.json();
            if (!res.ok) {
                console.log(data.message);
            } else {
                dispatch(signoutSuccess());
                navigate('/');
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    return (
        <div className='max-w-lg mx-auto p-3 w-full mb-10 relative isolate bg-white dark:bg-[rgb(22,26,29)] fade-in'>
            <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0 rotate-12 translate-x-[-15%]"
            >
                <div
                    style={{
                        clipPath:
                            'polygon(55% 20%, 80% 30%, 100% 70%, 90% 30%, 85% 40%, 75% 35%, 65% 45%, 55% 40%, 45% 50%, 35% 45%, 25% 55%, 15% 50%, 5% 60%, 0% 55%, 0% 100%, 10% 90%, 20% 95%, 30% 85%, 40% 90%, 50% 80%, 60% 85%, 70% 75%, 80% 80%, 10% 40%, 80% 75%, 100% 100%, 0% 100%)',
                    }}
                    className="relative left-[calc(50%-5rem)] aspect-[1155/678] w-[48rem] -translate-x-1/2 rotate-[25deg] bg-gradient-to-tr from-[#84ff53] to-[#f700ff] opacity-40 sm:left-[calc(50%-20rem)] sm:w-[80rem] animate-pulse"
                />
            </div>

            <h1 className='my-7 text-center font-semibold text-3xl'>Profile</h1>
            <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                <input type="file" accept='image/*' onChange={handleImageChange} ref={filePickerRef} hidden />
                <div className='relative w-32 h-32 self-center cursor-pointer shadow-md overflow-hidden rounded-full' onClick={() => filePickerRef.current.click()}>
                    {imageUploadProgress && (<CircularProgressbar value={imageUploadProgress || 0} text={`${imageUploadProgress}%`} strokeWidth={5} styles={{ root: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, }, path: { stroke: `rgba(62, 152, 199, ${imageUploadProgress / 100})`, }, }} />)}
                    <img src={imageFileUrl || currentUser.profilePicture} alt="user" className={`rounded-full w-full h-full object-cover border-8 border-[lightgray] ${imageUploadProgress && imageUploadProgress < 100 && 'opacity-60'}`} />
                </div>
                {imageUploadError && <Alert color='failure'>{imageUploadError}</Alert>}
                <div className='flex flex-col justify-center items-center gap-0 text-center mb-4'>
                    <span className='font-semibold text-gray-900 dark:text-gray-100'>@{currentUser.username}</span>
                    <span className='text-gray-500 dark:text-gray-400'>{currentUser.email}</span>
                </div>
                <h2 className='mt-2 text-center font-semibold text-2xl'>Personal Information Update</h2>

                <div className='flex flex-row gap-4 justify-between items-center w-full'>
                    <div className='flex flex-col gap-2 w-1/2'>
                        <Label>First Name</Label>
                        <TextInput
                            type='text'
                            id='firstName'
                            placeholder='First Name'
                            defaultValue={currentUser.firstName}
                            onChange={handleChange}
                        />
                        {validationErrors.firstName && (
                            <span className='text-red-500 text-sm'>{validationErrors.firstName}</span>
                        )}
                    </div>
                    <div className='flex flex-col gap-2 w-1/2'>
                        <Label>Last Name</Label>
                        <TextInput
                            type='text'
                            id='lastName'
                            placeholder='Last Name'
                            defaultValue={currentUser.lastName}
                            onChange={handleChange}
                        />
                        {validationErrors.lastName && (
                            <span className='text-red-500 text-sm'>{validationErrors.lastName}</span>
                        )}
                    </div>
                </div>
                {!currentUser.isGoogleUser && (
                    <>
                        <div className='flex flex-col gap-2'>
                            <Label>Current Password</Label>
                            <TextInput
                                type='password'
                                id='currentPassword'
                                placeholder='Current Password'
                                onChange={handleChange}
                            />
                            {validationErrors.currentPassword && (
                                <span className='text-red-500 text-sm'>{validationErrors.currentPassword}</span>
                            )}
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label>New Password</Label>
                            <TextInput
                                type='password'
                                id='password'
                                placeholder='New Password'
                                onChange={handleChange}
                            />
                            {validationErrors.password && (
                                <span className='text-red-500 text-sm'>{validationErrors.password}</span>
                            )}
                        </div>
                    </>
                )}
                <div className='flex items-center gap-2 text-center my-2'>
                    <FiAlertCircle className='w-5 h-5 text-yellow-500' />
                    <p className='text-gray-500 dark:text-gray-400 text-sm'>To update your profile photo, click on the image above</p>
                </div>
                <Button type='submit' gradientMonochrome="success" disabled={loading || imageFileUploading}>
                    {loading ? 'Loading...' : 'Update'}
                </Button>
                {
                    currentUser.isAdmin && (
                        <Link to={'/routes/create'}>
                            <Button type='button' gradientDuoTone='purpleToPink' outline className='w-full'>Create a route</Button>
                        </Link>
                    )
                }
            </form>
            {updateUserSuccess && (<Alert color='success' className='mt-5'>{updateUserSuccess}</Alert>)}
            {updateUserError && (<Alert color='failure' className='mt-5'>{updateUserError}</Alert>)}
            <div className='text-red-500 flex justify-between my-8'>
                <span onClick={() => setShowModal(true)} className='cursor-pointer' >Delete Account</span>
                <span onClick={() => setShowSignout(true)} className='cursor-pointer'>Sign Out</span>
            </div>


            <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to delete your account?</h3>
                        <div className='flex justify-center gap-6'>
                            <Button color='failure' onClick={handleDeleteUser}>Yes, I'm sure</Button>
                            <Button color='gray' onClick={() => setShowModal(false)}>Cancel</Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            <Modal show={showSignout} onClose={() => setShowSignout(false)} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to sign out?</h3>
                        <div className='flex justify-center gap-6'>
                            <Link to={'/'}>
                                <Button color='warning' onClick={handleSignout}>Yes, sign out</Button>
                            </Link>
                            <Button color='gray' onClick={() => setShowSignout(false)}>Cancel</Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    )
}
