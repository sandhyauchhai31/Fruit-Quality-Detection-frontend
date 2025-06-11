import axios from 'axios';
import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
// Register radar chart features
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
import '../index.css';
import './chartConfig'; 
import { motion } from "framer-motion";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';


function FruitUpload() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setResult(null);
    setError('');

    if (file) {
      const isImage = file.type.startsWith('image/');
      const isTooBig = file.size > 5 * 1024 * 1024;

      if (!isImage) return setError('Only image files are allowed.');
      if (isTooBig) return setError('File size must be less than 5MB.');

      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append("file", image);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data;
      setResult({
        fresh: Math.round(data.freshness),
        rotten: Math.round(data.rotten),
        fruit: data.fruit,
      });
    } catch (err) {
      console.error("Prediction failed", err);
      setError('Failed to upload or process the image.');
    } finally {
      setLoading(false);
    }
  };

  const radarData = result && (() => {
  const damageScore = result.fresh > 50 ? 10 : 100;
  const ripenessScore = result.fresh > 50 ? 80 : 100; 
  const colorQuality = result.fresh > 70
    ? 90
    : result.fresh > 40
    ? 70
    : 50;

  const sizeScore = result.fresh > 60 ? 80 : 60;

    return {
      labels: ['Freshness', 'Ripeness', 'Damage', 'Color Quality', 'Size'],
      datasets: [
        {
          label: result.fruit,
          data: [result.fresh, 
                  ripenessScore, 
                  damageScore, 
                  colorQuality, 
                  sizeScore],  
          backgroundColor: 'rgba(16,185,129,0.2)',
          borderColor: '#10b981',
          borderWidth: 1,
        },
      ],
    };
  })();
  
  const radarOptions = {
    responsive: true,
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { backdropColor: 'transparent', color: '#4B5563' },
        pointLabels: {
          callback: function(label) {
            // Optional: Shorten or customize label
            return label;
          }
        }
      }
    },
    plugins: {
      tooltip: {
        enabled: true,
        callbacks: {
          label: (tooltipItem) => `Score: ${tooltipItem.raw}`
        }
      }
    }
  };

  const getQualityLabel = (freshness) => {
    if (freshness <= 40) return { label: "Low", color: "red-500" };
    if (freshness <= 75) return { label: "Medium", color: "yellow-500" };
    return { label: "High", color: "green-500" };
  };

  const getFruitEmoji = (name) => {
    const map = {
      apple: "🍎",
      banana: "🍌",
      orange: "🍊",
      mango: "🥭",
      // add more if needed
    };
    return map[name?.toLowerCase()] || "🍓";
  };

  const capitalize = (s) => s?.charAt(0).toUpperCase() + s?.slice(1);
  
  function getArcPath(percentage) {
    const radius = 40;
    const startAngle = Math.PI; // 180 degrees
    const endAngle = Math.PI + Math.PI * (percentage / 100); // up to 360

    const x1 = 50 + radius * Math.cos(startAngle);
    const y1 = 50 + radius * Math.sin(startAngle);

    const x2 = 50 + radius * Math.cos(endAngle);
    const y2 = 50 + radius * Math.sin(endAngle);

    const largeArcFlag = percentage > 50 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  }




  return (
    
    <div className="relative min-h-screen w-screen bg-gradient-to-r from-green-200 via-white to-yellow-200 animate-gradient-x flex items-center justify-center p-8 overflow-hidden"
    style={{
    backgroundImage: `url('/images/fruit-bg.jpg')`,
  }}>


  <div className={`relative z-10 flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl w-full ${result ? 'max-w-screen-xl' : 'max-w-4xl'} overflow-hidden`}>
    {/* Left */}
    <div className="md:w-1/2 p-10 space-y-6">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 tracking-wide">
        🍎 Fruit Grading System
      </h1>

      <label className="block w-full cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500 hover:border-green-500">
        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        <span className="text-lg">{image ? image.name : 'Click to upload a fruit image'}</span>
      </label>

      {preview && (
        <div className="w-full h-64 overflow-hidden rounded-lg shadow">
          <img src={preview} alt="Preview" className="w-full h-full object-contain" />
        </div>
      )}

      {error && <p className="text-red-500 text-base text-center">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!image || loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
      >
        {loading ? <LoadingSpinner /> : 'Upload & Predict'}
      </button>

      <button
        onClick={() => {
          setImage(null);
          setPreview(null);
          setResult(null);
          setError('');
        }}
        className="w-full bg-gray-300 hover:bg-gray-400 text-black text-lg font-semibold py-3 rounded-xl mt-3 transition"
      >
        Reset
      </button>
    </div>

    {/* Right */}
    <motion.div
      className="md:w-1/2 p-10 space-y-6 flex flex-col items-center justify-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {!result ? (
        <div className="text-center space-y-6">
          <img
            src="/images/fruit-illustration.svg"
            alt="Upload illustration"
            className="w-72 h-72 mx-auto opacity-95"
          />
          <h3 className="text-xl text-gray-700 font-semibold">Start by uploading a fruit image</h3>
          <p className="text-base text-gray-500">Results will appear here once uploaded.</p>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-800">Prediction Results</h2>

          <Tippy content="Based on visual texture, color, and size using machine learning.">
            <p className="text-base text-gray-500 cursor-help underline decoration-dotted">
              This estimation is based on visual features.
            </p>
          </Tippy>

          {/* Meter Chart */}
          <motion.div className="w-72 h-72 relative" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }}>
            <svg viewBox="0 0 200 100" className="w-full h-auto">
              {/* Background semicircle */}
              <path
                d="M10,100 A90,90 0 0,1 190,100"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="16"
              />

              {/* Foreground arc — using strokeDasharray */}
              <path
                d="M10,100 A90,90 0 0,1 190,100"
                fill="none"
                stroke="url(#freshGradient)"
                strokeWidth="16"
                strokeDasharray={`${(result.fresh / 100) * 282.74} 282.74`}
                strokeLinecap="round"
              />

              <defs>
                <linearGradient id="freshGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6ee7b7" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>




            <div className="absolute inset-0 flex flex-col justify-center items-center gap-1">
              <div className="text-green-600 font-bold text-xl">{result.fresh}% Fresh</div>
              <div className="text-red-500 font-bold text-xl">{100 - result.fresh}% Rotten</div>
            </div>
          </motion.div>

          {/* Badge + Fruit Type */}
          <div className={`px-5 py-3 rounded-full bg-green-100 text-green-700 text-lg font-semibold shadow-sm`}>
            Fruit Quality: {getQualityLabel(result.fresh).label}
          </div>

          <div className="flex items-center gap-3 text-xl font-semibold text-blue-700 bg-blue-100 px-5 py-2 rounded-full shadow">
            <span>{getFruitEmoji(result.fruit)}</span>
            <span>{result.fruit?.charAt(0).toUpperCase() + result.fruit.slice(1)}</span>
          </div>

          {/* Radar Chart */}
          <div className="w-full flex justify-center p-4">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </>
      )}
    </motion.div>
  </div>
</div>

  );
}

export default FruitUpload;
