import ProfilePic from './../assets/profile.jpg'
import Button from './Button';
import ProfilePicture from './ProfilePicture';
function Card() {
    return(
       <div className="card">
        <img className='card-image' src={ProfilePic} alt="image"></img>
        <ProfilePicture></ProfilePicture>
        <h2 className="card-title">Test H2</h2>
        <p className='card-text'>Test p</p>
        <Button></Button>
       </div>
    );
}

export default Card ;