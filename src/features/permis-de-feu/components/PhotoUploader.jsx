import React from 'react';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';



// This component receives the array of photos and the function to update it

export const PhotoUploader = ({ photos, setPhotos }) => {



  const handleFileChange = (event) => {

    if (event.target.files) {

      const fileArray = Array.from(event.target.files).map(file => ({

        file: file,

        preview: URL.createObjectURL(file)

      }));

      setPhotos(prevPhotos => [...prevPhotos, ...fileArray]);

    }

  };

 

  const takePicture = async () => {

    try {

      const image = await Camera.getPhoto({

        quality: 90,

        allowEditing: false,

        resultType: CameraResultType.Uri,

        source: CameraSource.Camera

      });



      const response = await fetch(image.webPath);

      const blob = await response.blob();

      const file = new File([blob], `${Date.now()}.jpg`, { type: 'image/jpeg' });

     

      const newPhoto = {

        file: file,

        preview: URL.createObjectURL(file)

      };

      setPhotos(prevPhotos => [...prevPhotos, newPhoto]);



    } catch (error) {

      console.error("Error taking picture with Capacitor", error);

    }

  };



  const removePhoto = (indexToRemove) => {

    setPhotos(prevPhotos => prevPhotos.filter((_, index) => index !== indexToRemove));

  };



  return (

    <div className="border p-2 rounded bg-gray-50 my-3">

      <strong className="block mb-2">Photos de vérification:</strong>

      <div className="flex gap-2">

         {/* This is for web browser testing */}

        <label className="flex-1 bg-blue-500 text-white text-center p-2 rounded cursor-pointer hover:bg-blue-600">

          <span>Choisir Fichiers</span>

          <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />

        </label>

        {/* This button is for the mobile app */}

        <button type="button" onClick={takePicture} className="flex-1 bg-purple-500 text-white p-2 rounded hover:bg-purple-600">

          Prendre Photo

        </button>

      </div>

     

      {/* Previews */}

      <div className="grid grid-cols-3 gap-2 mt-3">

        {photos.map((photo, index) => (

          <div key={index} className="relative">

            <img src={photo.preview} alt="preview" className="w-full h-24 object-cover rounded" />

            <button

              type="button"

              onClick={() => removePhoto(index)}

              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"

            >

              X

            </button>

          </div>

        ))}

      </div>

    </div>

  );

};