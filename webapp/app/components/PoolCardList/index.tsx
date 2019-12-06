/**
 *
 * PoolCardList
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Typography, Paper, CardHeader, Card, CardContent, Chip, Grid } from '@material-ui/core';
import { Pool } from 'containers/App';

const styles = ({ palette }: Theme) =>
  createStyles({
    poolHeader: {
      paddingTop: '32px',
      paddingBottom: '16px',
      textAlign: 'center',
    },
    poolPaper: {
      borderTop: '#fd9920 2px solid',
      paddingBottom: '16px',
    },
    cardContent: {

    },
    card: {
      width: "400px",
      height: "450px",
      margin: 20

    },
    cardHeader:{
      backgroundColor: "#E5E5E5"
    },
    chip: {
      marginTop:10,
      marginRight: 20
    },
    label: {

    }
  });

interface OwnProps extends WithStyles<typeof styles> {
  pools: Array<Pool>
}

const PoolCardList: React.FunctionComponent<OwnProps> = ({ pools, classes }: OwnProps) => (
  <>
     <Paper elevation={5} className={classes.poolPaper}>
      <Typography variant="h5" className={classes.poolHeader}>
          Available Pools
        </Typography>
        <Card elevation={3}  className={classes.card}>
        <CardHeader
          className={classes.cardHeader}
          title={"Diamond 6"}
          action={
            <Chip color="primary" className={classes.chip} label={"3 Month"} />
          }
           />
        <CardContent className={classes.cardContent}>
         <Grid  container spacing={2} direction="column" alignItems="left">
         <Grid item xs={3} >
                <Typography className={classes.label}>Funding Progress</Typography>
               
         </Grid>
         <Grid item xs={3} >
                <Typography className={classes.label}>Funding Progress</Typography>
               
         </Grid>
         <Grid item xs={3} >
                <Typography className={classes.label}>Funding Progress</Typography>
               
         </Grid>
         <Grid item xs={3} >
                <Typography className={classes.label}>Funding Progress</Typography>
               
         </Grid>
         </Grid>
         <Grid item xs={3} >
                <Typography className={classes.label}>Funding Progress</Typography>
               
         </Grid>
         <Grid item xs={3} >
                <Typography className={classes.label}>Funding Progress</Typography>
               
         </Grid>

         
         
        </CardContent>

        </Card>
      </Paper>
  </>
);

export default withStyles(styles, { withTheme: true })(PoolCardList);
