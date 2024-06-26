import { useNavigate } from "react-router-dom"

const UnauthorizedPage = () => {
    const navigate = useNavigate();

    const goBack = () => navigate(-1);

    return (
        <section className="flex justify-center items-center w-full flex-col">
            <h1>Unauthorized</h1>
            <br />
            <p>You do not have access to the requested page.</p>
            <div className="flexGrow">
                <button onClick={(event)=>goBack(event)}>Go Back</button>
            </div>
        </section>
    )
}

export default UnauthorizedPage
