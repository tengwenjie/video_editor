import React, { useState, useRef } from "react";
import { Box, Button, Slider, Typography, LinearProgress } from "@mui/material";
import ReactPlayer from 'react-player';

export default function VideoEditor() {
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [trimRange, setTrimRange] = useState([0, 0]);
  const [outputUrl, setOutputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [mergedVideoBlob, setMergedVideoBlob] = useState(null);

  const playerRef = useRef(null);

  // 处理文件上传
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);
  
    const formData = new FormData();
    files.forEach(file => formData.append('videos', file));
  
    // 调用服务器端合并接口（注意端口和路径）
    const res = await fetch('http://3.112.34.135:3001/videos/merge', {
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
    setMergedVideoBlob(blob);
    setOutputUrl(url);
    setVideoUrl(url); // 预览合并后的视频
    setLoading(false);
  };

  const handleTrim = async () => {
    if (!mergedVideoBlob) {
      alert("请先选择视频文件");
      return;
    }
    if (trimRange[0] >= trimRange[1]) {
      alert("结束时间需大于开始时间");
      return;
    }
  
    const formData = new FormData();
    const file = new File([mergedVideoBlob], 'merged.mp4', { type: mergedVideoBlob.type || 'video/mp4' });
    formData.append('video', file);
    formData.append('start', trimRange[0]); // 起始时间（单位：秒，字符串类型）
    formData.append('end', trimRange[1]);     // 结束时间（单位：秒，字符串类型）
  
    setLoading(true);
    const res = await fetch('http://3.112.34.135:3001/videos/trim', {
      method: 'POST',
      body: formData,
    });
  
    if (!res.ok) {
      setLoading(false);
      alert('裁剪失败');
      return;
    }
  
    // 返回裁剪后的视频
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setOutputUrl(url);
    setLoading(false);
  };
  

  const handleDuration = (duration) => {
    setDuration(duration);
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
            disabled={loading || trimRange[1] - trimRange[0] <= 0}
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
