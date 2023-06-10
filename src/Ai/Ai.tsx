import { ChangeEventHandler, MutableRefObject, RefObject, useEffect, useRef, useState } from 'react';

import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';

import './Ai.css';

const Ai = () => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const cameraCanvas: any = useRef();

	const [results, setResults]: any = useState([]);
    const [loading, setLoading] = useState(false);
	const detectFaces = async (image: HTMLVideoElement | HTMLImageElement) => {
		if (!image) {
            console.log('no image')
			return;
		}

		const imgSize = image.getBoundingClientRect();
		const displaySize = { width: imgSize.width, height: imgSize.height };
		if (displaySize.height === 0) {
            console.log('image size err')
			return;
		}


		const faces = await faceapi
			.detectAllFaces(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
			.withFaceLandmarks()
			.withFaceExpressions()
			.withAgeAndGender();

		return faceapi.resizeResults(faces, displaySize);
	};
	const drawResults = async (image:any, canvas:any, results:any) => {
        /* if (loading) {
            setLoading(false)
        } */
		if (image && canvas && results) {
			const imgSize = image.getBoundingClientRect();
			const displaySize = { width: imgSize.width, height: imgSize.height };
			faceapi.matchDimensions(canvas, displaySize);
			canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
			const resizedDetections = faceapi.resizeResults(results, displaySize);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
		}
        else {
            console.log('no image, canvas, or results')
        }
	};

	const getFaces = async () => {
        console.log('get faces')
		if (videoRef.current !== null && videoRef.current !== undefined) {
			const faces = await detectFaces(videoRef.current/* .video */);
			await drawResults(videoRef.current/* .video */, cameraCanvas.current, faces);
			setResults(faces);
		}
        console.log('finished get faces')
        if (loading) {
            setLoading(false)
        }
	};

	const clearOverlay = (canvas: any) => {
		canvas.current.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
	};

    let [fileUploadProcessing, setFileUploadProcessing] = useState(false);
    const [captureVideo, setCaptureVideo] = useState(false);
    function startCamera() {
        setFileUploadProcessing(false);
        setCaptureVideo(true);
        setLoading(true);
        setFileOk(false);
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            videoRef!.current!.srcObject = stream;
        }).catch((err) => {
            console.log(err)
        });
    }
    function stopCamera() {
        videoRef.current!.pause();
        videoRef.current!.srcObject = null;
        setCaptureVideo(false);
        clearOverlay(cameraCanvas);
    }

    const imgCanvas: any = useRef();

    function startFile() {
        if (captureVideo) {
            stopCamera();
        }
        setFileUploadProcessing(true);
        setFileOk(false);
    }
    function cancelFile() {
        setFileUploadProcessing(false);
    }
    let [file, setFile] = useState<any>();
    let [fileOk, setFileOk] = useState(false);
    async function fileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        console.log('file upload')
        const { files } = e.target;
        const selectedFiles = files as FileList;
        setFile(selectedFiles?.[0]);
        setFileUploadProcessing(false);
        setFileOk(true);

        const img = await faceapi.bufferToImage(selectedFiles?.[0]);
        let faces = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();
        
        console.log(faces)
        const canvas = imgCanvas.current;
        faceapi.matchDimensions(canvas, img)
        faces = faceapi.resizeResults(faces, img)
        faceapi.draw.drawDetections(canvas, faces)
        faceapi.draw.drawFaceLandmarks(canvas, faces)
        faceapi.draw.drawFaceExpressions(canvas, faces)


        
    }

    const intervalRef = useRef<any>(null)
	useEffect(() => {
        if (captureVideo) {
            console.log('video enabled')

            if (videoRef !== null && videoRef !== undefined) {
                intervalRef.current = setInterval(async () => {
                    await getFaces();
                    /* if (loading) {
                        setLoading(false)
                    } */
                    console.log(captureVideo);
                }, 100);
                console.log(intervalRef.current)
                /* return () => {
                    clearOverlay(cameraCanvas);
                    clearInterval(ticking);
                }; */
            } /* else {
                clearInterval(ticking);
                return clearOverlay(cameraCanvas);
            } */
        } else {
            console.log('pong')
            console.log(captureVideo)
            console.log(intervalRef.current)
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

	}, [captureVideo]);

	return (
		<div className="ai">
			
			<div className='viewer'>
                {
                    captureVideo ?
                    <div className="camera">
                        {loading ? <div className='loading'> <div className='loader'></div> </div> : ''}
                        <video ref={videoRef} width="480px" height="365px" autoPlay></video>
                        <canvas className={'webcam-overlay'} ref={cameraCanvas}></canvas>
                    </div>
                    : (fileUploadProcessing ? 
                        <label className="upload">
                            <input type="file" onChange={fileUpload}/>
                            <div className='graphic'>
                                upload
                                <i className="fas fa-file-upload"></i>
                            </div>
                        </label>
                        :
                        <div className='nocamera'>
                            {
                                fileOk ?
                                <div className='uploaded'>
                                    <img src={URL.createObjectURL(file)} id="create" alt="uploaded file" />
                                    <canvas ref={imgCanvas}></canvas>
                                </div> :
                                ''
                            }
                        </div>)
                }
            </div>
			<div className='startstop'>
                {
                    !captureVideo ?
                    <button onClick={startCamera}>start camera</button>
                    : <button onClick={stopCamera}>stop camera</button>
                }
                {
                    !fileUploadProcessing ?
                    <button onClick={startFile}>upload file</button>
                    : <button onClick={cancelFile}>cancel upload</button>
                }
			</div>
		</div>
	);
}; export default Ai;