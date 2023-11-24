import { Link, useNavigate } from "react-router-dom"


const Missing = () => {
    const navigate = useNavigate();

    return (
        <article style={{ padding: "100px" }}>
            <h1>Oops!</h1>
            <p>Page Not Found</p>
            <div className="flexGrow">
                <Link to="/map">Visit Our Homepage</Link>
                </div> 
            <div >
                <button onClick={() => navigate(-2)}>Go back</button>
            </div>
        </article>
    )
}

export default Missing
