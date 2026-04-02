import { UploadCloud, Folder, Image as ImageIcon, CheckCircle, FileText, Palmtree as Palette } from 'lucide-react';
import styles from './design.module.css';

export default function DesignBoardPage() {
  const designs = [
    { id: 1, title: 'Bridal Lehenga - Front Sketch', type: 'sketch', date: 'Oct 12', size: '2.4 MB', thumb: styles.thumb1 },
    { id: 2, title: 'Embroidery Detail Ref', type: 'reference', date: 'Oct 12', size: '1.1 MB', thumb: styles.thumb2 },
    { id: 3, title: 'Zari Swatches', type: 'fabric', date: 'Oct 10', size: '4.5 MB', thumb: styles.thumb3 },
    { id: 4, title: 'Back Neckline Options', type: 'sketch', date: 'Oct 09', size: '1.8 MB', thumb: styles.thumb4 },
    { id: 5, title: ' दुपट्टा Draping ref', type: 'reference', date: 'Oct 08', size: '3.2 MB', thumb: styles.thumb5 },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Design Board</h1>
        <button className="btn btn-primary">
          <Folder size={18} style={{ marginRight: '0.5rem' }} />
          New Project
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.projectSelector}>
          <label>Project:</label>
          <select className={styles.select}>
            <option>Sanya K. Bridal Trousseau</option>
            <option>Rahul M. Groom Collection</option>
            <option>Aisha K. Party Wear</option>
          </select>
        </div>

        <div className={styles.folders}>
          <button className={`${styles.folderBtn} ${styles.active}`}>
            <ImageIcon size={16} /> All Files
          </button>
          <button className={styles.folderBtn}>
            <FileText size={16} /> Sketches
          </button>
          <button className={styles.folderBtn}>
            <Palette size={16} /> Fabrics & Textures
          </button>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Gallery */}
        <div className={styles.masonryGrid}>
          {designs.map(design => (
            <div key={design.id} className={styles.designCard}>
              <div className={`${styles.thumbnail} ${design.thumb}`}>
                <ImageIcon size={48} opacity={0.2} strokeWidth={1} />
              </div>
              <div className={styles.cardDetails}>
                <div className={styles.cardTitle}>{design.title}</div>
                <div className={styles.cardMeta}>
                  <span>{design.date}</span>
                  <span>{design.size}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Panel */}
        <div className={styles.sidebar}>
          {/* Upload Zone */}
          <div className={styles.uploadZone}>
            <div className={styles.uploadIcon}>
              <UploadCloud size={24} />
            </div>
            <div className={styles.uploadText}>Drop files here</div>
            <div className={styles.uploadSubtext}>JPG, PNG, PDF up to 50MB</div>
            <button className="btn btn-outline" style={{ marginTop: '0.5rem' }}>Browse Files</button>
          </div>

          {/* Approvals */}
          <div className={styles.recentApprovals}>
            <div className={styles.sectionTitle}>
              <CheckCircle size={18} color="var(--success)" />
              Recent Approvals
            </div>
            <div className={styles.approvalList}>
              <div className={styles.approvalItem}>
                <div className={styles.approvalAvatar}>SK</div>
                <div className={styles.approvalDetails}>
                  <div className={styles.approvalText}>
                    <strong>Sanya K.</strong> approved <em>Bridal Lehenga - Front Sketch</em>
                  </div>
                  <div className={styles.approvalTime}>2 hours ago</div>
                </div>
              </div>
              
              <div className={styles.approvalItem}>
                <div className={styles.approvalAvatar}>RM</div>
                <div className={styles.approvalDetails}>
                  <div className={styles.approvalText}>
                    <strong>Rahul M.</strong> requested changes on <em>Sherwani Collar</em>
                  </div>
                  <div className={styles.approvalTime}>Yesterday, 4:30 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
