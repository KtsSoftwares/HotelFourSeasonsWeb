import '../CSS/ZoomedImg.css';

const ZoomedImg = ({ zoomedImg, setZoomedImg }) => {
    return (
        <div className="lightbox-overlay" onClick={() => setZoomedImg(null)}>
            <div className="lightbox-content animate-zoom">
                <button className="lightbox-close" onClick={() => setZoomedImg(null)}>&times;</button>
                <img
                    src={zoomedImg || "https://via.placeholder.com/150?text=No+Image"}
                    alt="Enlarged ID"
                    className="img-fluid rounded"
                />
            </div>
        </div>
    );
};

export default ZoomedImg;