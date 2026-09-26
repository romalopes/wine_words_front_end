import styles from "./button.module.css"

function Button() {

    const handleClick = () => console.log("Button clicked");
    const handleClick2 = (name: string) => console.log(' Button clicked ' + name);

    let count = 0;
    const handleClickCount = (name: string) => {
        if (count < 3) { 
            count++;
            console.log("Button clicked count:" + count);
        }
        else {
            console.log(name + " Stop clicking me");
        }
    }

    const handleClickEvent = (e: React.MouseEvent<HTMLButtonElement>) => {
                                        console.log(e);
                                        e.currentTarget.textContent = "Ihh, clcked"
                                    }

    return(
       <>
            <button onClick={handleClick} className={styles.button}>Click me</button>
            <button onClick={() => handleClick2("Anderson")} className={styles.button}>Click me 2</button>
            <button onClick={() => handleClickCount("Maria")} className={styles.button}>Click me Count {count}</button>
            <button onDoubleClick={(e) => handleClickEvent(e)} className={styles.button}>Click me Event</button>
       </>
    );
}

export default Button ;