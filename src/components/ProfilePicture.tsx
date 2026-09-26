function ProfilePicture() {
    const imageUrl = './src/assets/profile.jpg'

    const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
        console.log("Image Profile Clicked "+ imageUrl)
        e.currentTarget.style.display = "none"
    }
    return(
       <>
        <img className='card-image' onClick={(e) => handleClick(e)} src={imageUrl}></img>
       </>
    );
}

export default ProfilePicture ;