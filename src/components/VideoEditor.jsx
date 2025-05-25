import React, { useState, useRef } from "react";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Box, Button, Slider, Typography, LinearProgress } from "@mui/material";
import ReactPlayer from 'react-player';

export default function VideoEditor() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [trimRange, setTrimRange] = useState([0, 0]);
  const [outputUrl, setOutputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const ffmpegRef = useRef(null);
  const playerRef = useRef(null);

  // 初始化ffmpeg
  const loadFFmpeg = async () => {
    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
      await ffmpegRef.current.load();
      setFfmpegLoaded(true);
    }
  };

  // 处理文件上传
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);
  
    const formData = new FormData();
    files.forEach(file => formData.append('videos', file));
  
    // 调用服务器端合并接口（注意端口和路径）
    const res = await fetch('http://localhost:3001/videos/merge', {
      method: 'POST',
      body: formData,
    });
  
    if (!res.ok) {
      setLoading(false);
      alert('服务器处理失败');
      return;
    }
  
    // 返回的是视频 blob
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setOutputUrl(url);
    setVideoUrl(url); // 预览合并后的视频
    setLoading(false);
  };
  

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h4" mb={2}>视频剪辑工具</Typography>
      <Button variant="contained" component="label">
        选择视频
        <input
            type="file"
            hidden
            accept="video/*"
            multiple
            onChange={handleFileChange}
            />
      </Button>

      {/* 原视频预览 */}
      {videoUrl && (
        <Box mt={2}>
          <Typography>原视频预览</Typography>
          <ReactPlayer
            url={videoUrl}
            controls
            width="100%"
            height="360px"
            ref={playerRef}
            onDuration={handleDuration}
          />
        </Box>
      )}

      {/* 裁剪滑块 */}
      {duration > 0 && (
        <Box mt={3}>
          <Typography gutterBottom>
            裁剪区间: {trimRange[0]}s - {trimRange[1]}s
          </Typography>
          <Slider
            value={trimRange}
            min={0}
            max={Math.floor(duration)}
            step={1}
            marks
            onChange={(_, newValue) => setTrimRange(newValue)}
            valueLabelDisplay="auto"
            disableSwap
          />
        </Box>
      )}

      {/* 剪辑按钮 */}
      {videoUrl && (
        <Box mt={2}>
          <Button
            variant="contained"
            onClick={handleTrim}
            disabled={loading || trimRange[1] - trimRange[0] <= 0 || !ffmpegLoaded}
          >
            剪辑并导出
          </Button>
        </Box>
      )}

      {loading && (
        <Box mt={2}>
          <LinearProgress />
          <Typography>正在处理视频...</Typography>
        </Box>
      )}

      {/* 剪辑后视频预览 */}
      {outputUrl && (
        <Box mt={3}>
          <Typography>剪辑后视频预览</Typography>
          <ReactPlayer url={outputUrl} controls width="100%" height="360px" />
          <Button
            sx={{ mt: 1 }}
            variant="outlined"
            href={outputUrl}
            download="edited.mp4"
          >
            下载剪辑视频
          </Button>
        </Box>
      )}
    </Box>
  );
}
