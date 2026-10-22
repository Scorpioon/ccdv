import { motion } from "motion/react";
export interface HomeStudioStripProps { onEnter: () => void; leaving: boolean; reduced: boolean; }
export function HomeStudioStrip({ onEnter, leaving, reduced }: HomeStudioStripProps) {
  return (
    <motion.section className="home-studio-strip" aria-label="Studio section"
      initial={false}
      animate={{ minHeight: leaving ? "55vh" : "185px" }}
      transition={{ duration: reduced ? 0 : 0.3, ease: "easeInOut" }}>
      <div className="home-studio-strip__inner">
        <span className="strip-index" aria-hidden="true">[ 02 ]</span>
        <span className="home-studio-strip__title">STUDIO</span>
        <motion.button
          type="button" className="strip-arrow"
          onClick={onEnter} aria-label="Enter Studio"
          initial={false}
          animate={leaving ? { rotate: 180, scale: 1.2 } : { rotate: 0, scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
        >v</motion.button>
      </div>
    </motion.section>
  );
}
