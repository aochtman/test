import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import TextToImage from "./pages/TextToImage";
import ImageToImage from "./pages/ImageToImage";
import ImageToVideo from "./pages/ImageToVideo";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/txt2img" element={<TextToImage />} />
        <Route path="/img2img" element={<ImageToImage />} />
        <Route path="/img2vid" element={<ImageToVideo />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/txt2img" replace />} />
      </Route>
    </Routes>
  );
}
