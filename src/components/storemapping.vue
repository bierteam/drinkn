<template>
    <body>
    <header>	
        <title>StorevMapping</title>
        <h1 class="headertitle">Store Mapping</h1>
    </header>
    <form action="post" class="mappingform">
        <label class="oldstorelabel">Old Store</label>
        <label class="newstorelabel">New Store</label>
        <div>
            <input type="text" class="oldstore forminput" value="albert heijn">
            <span class="arrow">&#8594;</span>
            <input type="text" class="newstore forminput">
            <input type="text" class="oldstore forminput">
            <span class="arrow">&#8594;</span>
            <input type="text" class="newstore forminput">
            <input type="text" class="oldstore forminput">
            <span class="arrow">&#8594;</span>
            <input type="text" class="newstore forminput">
            <input type="text" class="oldstore forminput">
            <span class="arrow">&#8594;</span>
            <input type="text" class="newstore forminput">
            <input type="text" class="oldstore forminput">
            <span class="arrow">&#8594;</span>
            <input type="text" class="newstore forminput">
            <input type="text" class="oldstore forminput">
            <span class="arrow">&#8594;</span>
            <input type="text" class="newstore forminput">
            <input type="text" class="oldstore forminput">
            <span class="arrow">&#8594;</span>
            <input type="text" class="newstore forminput">
            <input type="text" class="oldstore forminput">
            <span class="arrow">&#8594;</span>
            <input type="text" class="newstore forminput">
        </div>
        <button class="mappingforminputsubmit" type="submit">Save</button>
    </form>
    <footer>
    </footer>
</body>
</template>
<style scoped>
    body {
        background-color: white;
        font-family: 'Raleway', sans-serif;
    }   
    .headertitle {
        text-align: center;
    }
    .forminput {
        display: inline-block;
        padding: 12px;
        margin: 5px 0; 
        margin-left: 1px;
        max-width: 35%;
        border-color: black;
        border-width: thin;
        font-size: 19px;
        
    }

    .oldstorelabel {
        padding-right: 7em;
        padding-left: 1em;
    }
    .mappingforminputsubmit {
    display: block;
    margin: auto;
    margin-top: 1em;
    padding: 15px 45px;
    }
</style> 
