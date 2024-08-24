import React, { useState, useEffect, useRef } from 'react';

const VoiceRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [title, setTitle] = useState('');
  const [recordings, setRecordings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const savedRecordings = JSON.parse(localStorage.getItem('recordings')) || [];
    setRecordings(savedRecordings);
  }, []);

  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    // Initialize Web Audio API for visualization
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    source.connect(analyserRef.current);
    analyserRef.current.fftSize = 2048;

    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    draw();

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.start();
  };

  const stopRecording = () => {
    setRecording(false);
    mediaRecorderRef.current.stop();
    cancelAnimationFrame(animationRef.current);

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const newRecording = {
        title: title || `Recording ${recordings.length + 1}`,
        blobURL: audioUrl,
        id: new Date().getTime(),
      };
      const updatedRecordings = [...recordings, newRecording];

      setRecordings(updatedRecordings);
      setTitle('');
      setAudioChunks([]);
      localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
    };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const drawWaveform = () => {
      animationRef.current = requestAnimationFrame(drawWaveform);
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

      canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

      canvasCtx.beginPath();

      const sliceWidth = WIDTH / dataArrayRef.current.length;
      let x = 0;

      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const v = dataArrayRef.current[i] / 128.0;
        const y = (v * HEIGHT) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    drawWaveform();
  };

  const deleteRecording = (id) => {
    const updatedRecordings = recordings.filter((rec) => rec.id !== id);
    setRecordings(updatedRecordings);
    localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
  };

  const editRecordingTitle = (id) => {
    const recording = recordings.find((rec) => rec.id === id);
    setTitle(recording.title);
    setEditingId(id);
  };

  const saveEditedTitle = () => {
    const updatedRecordings = recordings.map((rec) =>
      rec.id === editingId ? { ...rec, title } : rec
    );
    setRecordings(updatedRecordings);
    setTitle('');
    setEditingId(null);
    localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
  };

  const filteredRecordings = recordings.filter((rec) =>
    rec.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h1>Voice Recorder</h1>
      <input 
        type="text" 
        placeholder="Search recordings..." 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="Enter title..." 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
      />
      {editingId ? (
        <button onClick={saveEditedTitle}>Save Title</button>
      ) : (
        <>
          <button onClick={startRecording} disabled={recording}>
            Start Recording
          </button>
          <button onClick={stopRecording} disabled={!recording}>
            Stop Recording
          </button>
        </>
      )}
      <canvas ref={canvasRef} width="600" height="100"></canvas>
      <h2>Saved Recordings</h2>
      <ul>
        {filteredRecordings.map((rec) => (
          <li key={rec.id}>
            <p>{rec.title}</p>
            <audio controls src={rec.blobURL}></audio>
            <button onClick={() => deleteRecording(rec.id)}>Delete</button>
            <button onClick={() => editRecordingTitle(rec.id)}>Edit Title</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VoiceRecorder;
