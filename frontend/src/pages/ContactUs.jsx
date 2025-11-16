import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Field, Switch } from '@headlessui/react'
import { TextInput, Label, Checkbox, Textarea, Button, Alert } from 'flowbite-react'
import { CheckIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { FaWhatsapp } from "react-icons/fa";
import { IoIosMail } from "react-icons/io";

export default function ContactUs() {

    const [open, setOpen] = useState(false)
    const [submitError, setSubmitError] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        phoneNumber: '',
        message: ''
    });


    const handleSubmit = async (e) => {
        e.preventDefault();

        const validateEmail = (email) => {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        }

        const validatePhoneNumber = (phoneNumber) => {
            const phoneRegex = /^\+?[\d\s]+$/;
            return phoneRegex.test(phoneNumber);
        }

        if (
            !formData.name ||
            !formData.surname ||
            !formData.email ||
            !formData.phoneNumber ||
            !formData.message
        ) {
            setSubmitError('All fields have to be filled!');
            return;
        }

        if (!validateEmail(formData.email)) {
            setSubmitError('Invalid email!');
            return;
        }

        if (!validatePhoneNumber(formData.phoneNumber)) {
            setSubmitError('Invalid phone number!');
            return;
        }

        try {
            const res = await fetch('/api/contact/createContact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...formData }),
            });
            const data = await res.json();
            if (!res.ok) {
                setSubmitError(data.message);
                return;
            }
            if (res.ok) {
                setOpen(true);
                setSubmitError(null);
                setFormData({
                    name: '',
                    surname: '',
                    email: '',
                    phoneNumber: '',
                    message: ''
                });
            }
        } catch (error) {
            setSubmitError('Something went wrong');
            console.error(error.message);
        }
    };

    return (
        <div className="relative isolate bg-white dark:bg-[rgb(22,26,29)] px-6 py-24 sm:py-32 lg:px-8">
            <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0"
            >
                <div
                    style={{
                        clipPath:
                            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 85% 110%, 90% 125%, 95% 140%, 98% 155%, 100% 170%, 100% 200%)',
                    }}
                    className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#48ff00] to-[#0f63e2] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-pulse"
                />
            </div>

            <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-4xl font-bold tracking-tight text-balance text-gray-900 dark:text-gray-50 sm:text-5xl">Contact Us</h2>
                <p className="my-2 text-lg/8 text-gray-600 dark:text-gray-400">You can contact us for anything you can think of. Either by sending a message or by calling directly...</p>
                <div className='flex justify-center items-center'>
                    <p className='text-xl sm:text-2xl font-semibold'>+90 543 000 00 00</p>
                    <FaWhatsapp className='text-green-500 text-4xl ml-2' />
                </div>
                <div className='flex justify-center items-center'>
                    <p className='text-xl sm:text-2xl font-semibold'>customer@gmail.com</p>
                    <IoIosMail className='text-gray-800 dark:text-gray-300 text-4xl mt-1 ml-2' />
                </div>
            </div>


            <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-xl sm:mt-16">
                <h2 className="text-2xl font-semibold tracking-tight text-balance text-center text-gray-800 dark:text-gray-50 sm:text-4xl mb-3">Contact Form</h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                    <div>
                        <div className="mb-1 block">
                            <Label htmlFor="name" value="Your name" />
                        </div>
                        <TextInput id="name" type="text" sizing='md' required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <div className="mb-1 block">
                            <Label htmlFor="surname" value="Your surname" />
                        </div>
                        <TextInput id="surname" type="text" sizing='md' required value={formData.surname} onChange={(e) => setFormData({ ...formData, surname: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                        <div className="mb-1 block">
                            <Label htmlFor="email" value="E-mail" />
                        </div>
                        <TextInput id="email" type="email" sizing='md' required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                        <div className="mb-1 block">
                            <Label htmlFor="phonenumber" value="Your phone number" />
                        </div>
                        <TextInput id="phonenumber" type="tel" sizing='md' placeholder='+XX XXXXXXXXXX' required value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                        <Label htmlFor="message" value="Message" />
                        <Textarea className='min-h-20 max-h-80 sm:max-h-40 mt-1' id='message' placeholder='Leave a message...' rows='3' maxLength='800' required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                        <p className='text-gray-500 dark:text-gray-400 text-xs mb-3'>{800 - formData.message.length} characters remaining</p>
                    </div>
                    <Field className="flex gap-x-4 sm:col-span-2">
                        <div className="flex h-6 items-center">
                            <Checkbox id="accept" required />
                        </div>
                        <Label className="text-sm/6 text-gray-600 dark:text-gray-50">
                            By selecting this, you agree to our{' '}
                            <a href="#" className="font-semibold text-sky-700 dark:text-sky-600">
                                privacy&nbsp;policy
                            </a>
                            .
                            <p className='text-gray-500 dark:text-gray-400 text-xs'>(required)</p>
                        </Label>
                    </Field>
                </div>
                <div className="mt-10">
                    {submitError &&
                        <Alert color='failure' className='mb-5'>{submitError}</Alert>
                    }
                    <Button type="submit" outline gradientDuoTone="greenToBlue" className='w-full'>
                        Send
                    </Button>
                </div>
            </form>

            <Dialog open={open} onClose={setOpen} className="relative z-10">
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                />

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 mr-4 text-center sm:items-center sm:p-0">
                        <DialogPanel
                            transition
                            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                        >
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="">
                                    <div className="mx-auto flex size-14 shrink-0 items-center justify-center rounded-full bg-green-100">
                                        <CheckIcon aria-hidden="true" className="size-9 text-green-500" />
                                    </div>
                                    <div className="mt-1 text-center">
                                        <DialogTitle as="h3" className="pb-5 text-xl font-semibold text-green-900">
                                            Sended Successfuly
                                        </DialogTitle>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                <span className='font-semibold'>We appreciate your interest!</span> We will contact you as soon as possible via the phone number you provided.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-4 sm:flex sm:flex-row sm:justify-evenly sm:px-6 sm:gap-5">
                                <Link to='/' className="my-3 mt-0 sm:my-0 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-md ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0">
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                    >
                                        Return to Home Page
                                    </button>
                                </Link>
                                {/*                                 <Link to='/dashboard?tab=bookings' className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-md hover:bg-green-500">
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                    >
                                        Go to Your Bookings
                                    </button>
                                </Link>
 */}
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}
