import { motion } from "motion/react";
export function StudioWheel({ exiting, reduced }: { exiting: boolean; reduced: boolean }) {
  return (
    <motion.div className="studio-wheel" role="img" aria-label="Rotating graphical studio wheel"
      initial={false}
      animate={exiting ? { rotate: -90, x: "-95%", opacity: 0 } : { rotate: 0, x: "0%", opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.3, ease: "easeInOut" }}
    >
      <div className="studio-wheel__inner"><span>CCDV</span></div>
    </motion.div>
  );
}
