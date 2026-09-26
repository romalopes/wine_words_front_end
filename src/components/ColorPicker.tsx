import { useState, type ChangeEvent } from "react";
import styles from "./colorPicker.module.css"

function ColorPicker() {
    const [color, setColor] = useState("#FFFFFF");

    function handleColorChange(event: ChangeEvent<HTMLInputElement>) {
        setColor(event.target.value)
    }
    return(
       <>
        <div className={styles.color_picker_container}>
            <h1 className={styles.color_picker_container_h1}>Color Picker</h1>
            <div className={styles.color_display} style={{backgroundColor: color}}>
                <p className={styles.color_display_p}>Selected Color: {color}</p>
            </div>
            <label>Select Color</label>
            <input type="color" value={color} onChange={(e) => handleColorChange(e)} ></input>
        </div>
       </>
    );
}

export default ColorPicker ;