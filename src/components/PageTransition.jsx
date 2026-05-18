import { motion } from "framer-motion";

export default function PageTransition({ children, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

