import { Badge, Button, Label, Modal, Select, Spinner, Table, TextInput } from 'flowbite-react';
import React, { useEffect, useState } from 'react'
import { FaCheck, FaTimes } from 'react-icons/fa';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { useSelector } from 'react-redux';

const viewValues = [
  {
    settingType: 'timeWarningNew',
    viewValue:
      <span className='flex justify-center items-center'>
        Duration of
        <Badge color='warning' size='xs' className='mx-1'>NEW!</Badge>
        tag for route cards
      </span>
  },
  {
    settingType: 'timeBookedBefore',
    viewValue:
      <span className='flex justify-center items-center'>
        Duration of warning for recently booked ads:
      </span>
  },
]

export default function DashSettings() {

  const { currentUser } = useSelector((state) => state.user)
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState([]);
  const [formDataTimeWarningNew, setFormDataTimeWarningNew] = useState({ timeWarningNew: "" });
  const [formDataTimeBookedBefore, setFormDataTimeBookedBefore] = useState({ timeBookedBefore: "" });
  const [publishError, setPublishError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/setting/allSettings');
        const data = await res.json();
        if (res.ok) {
          setLoading(false);
          setSettings(data);

          const timeWarningSetting = data.find(setting => setting.settingType === 'timeWarningNew');
          if (timeWarningSetting) {
            setFormDataTimeWarningNew({ timeWarningNew: timeWarningSetting.value });
          }
          const timeBookedBeforeSetting = data.find(setting => setting.settingType === 'timeBookedBefore');
          if (timeBookedBeforeSetting) {
            setFormDataTimeBookedBefore({ timeBookedBefore: timeBookedBeforeSetting.value });
          }
        }
      } catch (error) {
        setLoading(true);
        console.log(error.message);
      }
    };
    if (currentUser.isAdmin) {
      fetchSettings();
    }
  }, [currentUser._id]);


  const defineTimeWarningNew = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/setting/defineTimeWarningNew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataTimeWarningNew)
      });

      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.message);
        setSuccessMessage(null);
        return;
      }

      if (res.ok) {
        setPublishError(null);
        setSuccessMessage('Setting updated successfully!');
        const res = await fetch('/api/setting/allSettings');
        const updatedSettings = await res.json();
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error:', error);
      setPublishError('Something went wrong');
      setSuccessMessage(null);
    }
  };

  const defineTimeBookedBefore = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/setting/defineTimeBookedBefore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataTimeBookedBefore)
      });

      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.message);
        setSuccessMessage(null);
        return;
      }

      if (res.ok) {
        setPublishError(null);
        setSuccessMessage('Setting updated successfully!');
        const res = await fetch('/api/setting/allSettings');
        const updatedSettings = await res.json();
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error:', error);
      setPublishError('Something went wrong');
      setSuccessMessage(null);
    }
  };

  if (loading) return (
    <div className='flex p-5 justify-center pb-96 items-center md:items-baseline min-h-screen'>
      <Spinner size='xl' />
      <p className='text-center text-gray-500 m-2'>Loading...</p>
    </div>
  );


  return (
    <>
      <div className="flex-1 min-h-screen relative isolate bg-white dark:bg-[rgb(22,26,29)] px-6 py-6 sm:py-10 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0"
        >
          <div
            style={{
              clipPath:
                'polygon(85% 40%, 100% 55%, 100% 30%, 90% 10%, 85% 5%, 78% 25%, 65% 60%, 55% 70%, 50% 65%, 48% 35%, 30% 80%, 0% 70%, 20% 100%, 30% 78%, 80% 95%, 90% 110%, 95% 130%, 98% 145%, 100% 160%, 100% 200%, 50% 10%)',
            }}
            className="relative left-[calc(50%-5rem)] aspect-[1155/678] w-[48rem] -translate-x-1/2 rotate-[25deg] bg-gradient-to-tr from-[#2858f7] to-[#b6d40e] opacity-40 sm:left-[calc(50%-20rem)] sm:w-[80rem] animate-pulse"
          />
        </div>

        {currentUser.isAdmin && (
          <>
            <div className='flex flex-col justify-center items-center text-gray-500 m-2 text-center border-4 border-teal-300 border-dotted p-3 rounded-lg'>
              <p>
                <span className='font-bold text-4xl text-gray-800 dark:text-gray-100'>
                  Manipulate Settings
                </span>
                <br />
                Settings are only editable by admins.
              </p>

              <div>
                <div className='flex flex-col gap-4 mt-4' >
                  <div className='flex flex-col gap-1 justify-between'>

                    <form onSubmit={defineTimeWarningNew} >
                      <div className='flex-1 flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center border-2 border-gray-300 dark:border-gray-600 border-dotted p-2 rounded-lg shadow-inner'>
                        <Label htmlFor="timeWarningNew" className="block text-sm font-medium leading-6">
                          <span className='flex justify-center items-center'>
                            Duration of
                            <Badge color='warning' size='xs' className='mx-1'>NEW!</Badge>
                            tag for route cards:
                          </span>
                        </Label>
                        <div className='flex flex-row gap-4 justify-center items-center'>
                          <Select
                            id="timeWarningNew"
                            sizing='sm'
                            value={formDataTimeWarningNew.timeWarningNew}
                            onChange={(e) => setFormDataTimeWarningNew({ timeWarningNew: e.target.value })}>
                            <option value="0">Don't show</option>
                            <option value="1">1 day</option>
                            <option value="2">2 days</option>
                            <option value="3">3 days</option>
                            <option value="4">4 days</option>
                            <option value="5">5 days</option>
                            <option value="6">6 days</option>
                            <option value="7">1 week</option>
                            <option value="14">2 weeks</option>
                            <option value="21">3 weeks</option>
                            <option value="30">1 month</option>
                          </Select>
                          {settings.find(setting => setting.settingType === 'timeWarningNew') &&
                            settings.find(setting => setting.settingType === 'timeWarningNew').value !== formDataTimeWarningNew.timeWarningNew && (
                              <Button outline type='submit' className='' gradientDuoTone='greenToBlue' size='xs'>
                                <span className='flex justify-center items-center'>
                                  <FaCheck className='mr-1' /> Save
                                </span>
                              </Button>
                            )}
                        </div>
                      </div>
                    </form>

                    <form onSubmit={defineTimeBookedBefore} >
                      <div className='flex-1 flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center border-2 border-gray-300 dark:border-gray-600 border-dotted p-2 rounded-lg shadow-inner'>
                        <Label htmlFor="timeBookedBefore" className="block text-sm font-medium leading-6">
                          <span className='flex justify-center items-center'>
                            Duration of warning for recently booked ads:
                          </span>
                        </Label>
                        <div className='flex flex-row gap-4 justify-center items-center'>
                          <Select
                            id="timeBookedBefore"
                            sizing='sm'
                            value={formDataTimeBookedBefore.timeBookedBefore}
                            onChange={(e) => setFormDataTimeBookedBefore({ timeBookedBefore: e.target.value })}>
                            <option value="0">Don't show</option>
                            <option value="3">3 days</option>
                            <option value="7">1 week</option>
                            <option value="14">2 weeks</option>
                            <option value="21">3 weeks</option>
                            <option value="30">1 month</option>
                            <option value="60">2 months</option>
                            <option value="90">3 months</option>
                            <option value="180">6 months</option>
                            <option value="360">1 year</option>
                          </Select>
                          {settings.find(setting => setting.settingType === 'timeBookedBefore') &&
                            settings.find(setting => setting.settingType === 'timeBookedBefore').value !== formDataTimeBookedBefore.timeBookedBefore && (
                              <Button outline type='submit' className='' gradientDuoTone='greenToBlue' size='xs'>
                                <span className='flex justify-center items-center'>
                                  <FaCheck className='mr-1' /> Save
                                </span>
                              </Button>
                            )}
                        </div>
                      </div>
                    </form>
                    {publishError && (
                      <p className='text-red-500 text-center mt-2'>{publishError}</p>
                    )}
                    {successMessage && (
                      <p className='text-green-500 text-center mt-2'>{successMessage}</p>
                    )}


                  </div>

                </div >
              </div>

            </div>
          </>
        )}


        <div className='flex flex-col justify-center items-center text-gray-500 m-2 mt-10 text-center'>
          <span className='font-bold text-4xl text-gray-800 dark:text-gray-100'>
            Current System Settings
          </span>
          <div className='table-auto md:mx-auto p-4 relative z-10'>
            {currentUser.isAdmin && settings && settings.length > 0 ? (
              <Table hoverable className='shadow-md'>
                <Table.Head>
                  <Table.HeadCell>Setting Type</Table.HeadCell>
                  <Table.HeadCell>Value</Table.HeadCell>
                  <Table.HeadCell>Prev. Change Date</Table.HeadCell>
                </Table.Head>
                {settings.map((setting) => (
                  <Table.Body key={setting._id} className='divide-y'>
                    <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                      <Table.Cell>{viewValues.find(key => key.settingType === setting.settingType).viewValue}</Table.Cell>
                      <Table.Cell>{setting.value} day(s)</Table.Cell>
                      <Table.Cell>{new Date(setting.updatedAt).toLocaleDateString() + ' ' + new Date(setting.updatedAt).toLocaleTimeString()}</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                ))}
              </Table>
            ) : (
              <div className='flex justify-center items-center text-gray-500 text-center'>
                <span className='text-lg text-gray-800 dark:text-gray-300'>
                  There is no settings yet!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
{/*         <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
          <Modal.Header />
          <Modal.Body>
            <div className="text-center">
              <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
              <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to delete this user?</h3>
              <div className='flex justify-center gap-6'>
                <Button color='failure' onClick={handleDeleteUser}>Yes, I'm sure</Button>
                <Button color='gray' onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
 */}


{/*       <div className='flex flex-col p-5 justify-center items-center md:items-baseline min-h-screen'>
        <h1 className='text-2xl font-bold mb-5'>Settings</h1>
        <div className='w-full max-w-2xl'>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setting Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settings ? (
                settings.map((setting) => (
                  <tr key={setting._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{setting.settingType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{setting.value}</td>
                  </tr>
                ))

              ) : (
                <tr>
                  <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">No settings found</td>
                </tr>

              )}
            </tbody>
          </table>
        </div >
      </div >
      <div className='flex justify-center items-center'>
        <p className='text-gray-500 m-2'>Settings are only editable by admins.</p>
      </div>
 */}
