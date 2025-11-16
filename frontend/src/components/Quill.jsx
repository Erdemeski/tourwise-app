import React from 'react'
import ReactQuill from 'react-quill'

export default function Quill({ referance, onChange }) {
    return (
        <ReactQuill theme='snow' value={referance || ''} placeholder='Write something for "Additional Infos" part...' className='h-48 mb-12' onChange={onChange} />
    )
}
