import React, { useState } from "react";
import Box from '@mui/material/Box';
import Checkbox from "@material-ui/core/Checkbox";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    
    formControl: {
      margin: theme.spacing(1),
      width: 300,
    },
    indeterminateColor: {
      color: "#8BEDF3"
    },
    selectAllText: {
      fontWeight: 500
    },
    selectedAll: {
      backgroundColor: "rgba(153,83,114, 0.08)",
      "&:hover": {
        backgroundColor: "rgba(153,83,114, 0.08)"
      }
    },
  }));
  

  const MenuProps = {
    PaperProps: {
      style: {
        height: 300,
        width: 250,
        overflowX: "scroll"
      },
    },
    getContentAnchorEl: null,
    anchorOrigin: {
      vertical: "bottom",
      horizontal: "center"
    },
    transformOrigin: {
      vertical: "top",
      horizontal: "center"
    },
    variant: "menu"
  };
  

function MultipleSelectTest(options) {

  const classes = useStyles();
  
  const [selected, setSelected] = useState([]);

  const isAllSelected =
    options.length > 0 && selected.length === options.length;

  const handleChange = (event) => {
    const value = event.target.value;
    if (value[value.length - 1] === "all") {
      setSelected(selected.length === options.length ? [] : options);
      return;
    }
    setSelected(value);
  };

  return (
    <FormControl className={classes.formControl}>
      
      <Select
        labelId="mutiple-select-label"
        className='text-sm text-gray-base w-full mr-3 py-5 px-4 h-2 border 
                border-gray-primary rounded mb-2 focus:outline-[#8BEDF3]
                hover:outline-none outline-none' 
        multiple
        placeholder="Colors"
        value={selected}
        onChange={(event)=>handleChange(event)}
        renderValue={(selected) => <Box sx={{overflowX: 'scroll', outline: 'none'}}>{selected.join(", ")}</Box>}
        MenuProps={MenuProps}
        disableUnderline={true}
      >
        
        <MenuItem
          value="all"
          classes={{
            root: isAllSelected ? classes.selectedAll : ""
          }}
        >
          <ListItemIcon>
            <Checkbox
              checked={isAllSelected}
              indeterminate={
                selected.length > 0 && selected.length < options.length
              }
              style ={{
                color: "#8BEDF3",
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary="Select All"
          />
        </MenuItem>

        {options.map((option) => (
          <MenuItem key={option} value={option} style={{backgroundColor: 'white'}}>
            <ListItemIcon>
              <Checkbox 
                checked={selected.indexOf(option) > -1} 
                style ={{
                    color: "#8BEDF3",
                  }}
              />
            </ListItemIcon>
            <ListItemText primary={option} />
          </MenuItem>
        ))}
      </Select>
      
    </FormControl>
  );
}

export default MultipleSelectTest;
