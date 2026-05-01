// Global references
const { useState, useEffect } = React;
const {
    Container,
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    TextField,
    Card,
    CardContent,
    CardActions,
    Grid,
    Paper,
    Chip,
    Tabs,
    Tab,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    CircularProgress,
    Avatar,
    Divider,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineDot,
    TimelineConnector,
    TimelineContent,
    TimelineOppositeContent,
    Icon,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Collapse,
} = MaterialUI;

const { createTheme, ThemeProvider } = MaterialUI;
const { styled } = EmotionStyled;
const { css, Global } = EmotionReact;

// Create a theme instance.
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f5f5f5',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
});

// Styled components
const MainContainer = styled(Container)({
    marginTop: '24px',
    marginBottom: '24px',
});

const StyledCard = styled(Card)({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'box-shadow 0.3s',
    '&:hover': {
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
    },
});

const StyledCardContent = styled(CardContent)({
    flexGrow: 1,
});

const PageTitle = styled(Typography)({
    marginBottom: '24px',
    fontWeight: '500',
});

// Timeline Editor Component
const TimelineEditor = ({ timeline, onChange }) => {
    const [events, setEvents] = useState(timeline || []);
    const [newEvent, setNewEvent] = useState({ time: '', event: '' });

    useEffect(() => {
        onChange(events);
    }, [events]);

    const handleAdd = () => {
        if (!newEvent.time || !newEvent.event) return;
        setEvents([...events, { ...newEvent }]);
        setNewEvent({ time: '', event: '' });
    };

    const handleDelete = (index) => {
        setEvents(events.filter((_, i) => i !== index));
    };

    const handleChangeTime = (index, value) => {
        const updated = [...events];
        updated[index].time = value;
        setEvents(updated);
    };

    const handleChangeEvent = (index, value) => {
        const updated = [...events];
        updated[index].event = value;
        setEvents(updated);
    };

    return (
        <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
                Timeline Events
            </Typography>
            <List dense>
                {events.map((item, index) => (
                    <ListItem key={index}>
                        <TextField
                            label="Time"
                            value={item.time}
                            onChange={(e) => handleChangeTime(index, e.target.value)}
                            size="small"
                            style={{ width: '100px', marginRight: '16px' }}
                        />
                        <TextField
                            label="Event"
                            value={item.event}
                            onChange={(e) => handleChangeEvent(index, e.target.value)}
                            size="small"
                            style={{ flexGrow: 1, marginRight: '16px' }}
                        />
                        <IconButton size="small" onClick={() => handleDelete(index)}>
                            <span className="material-icons">delete</span>
                        </IconButton>
                    </ListItem>
                ))}
            </List>
            <Box display="flex" alignItems="center" mt={2}>
                <TextField
                    label="Time"
                    placeholder="e.g., 14:30"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    size="small"
                    style={{ width: '100px', marginRight: '16px' }}
                />
                <TextField
                    label="Event"
                    placeholder="e.g., Introduction"
                    value={newEvent.event}
                    onChange={(e) => setNewEvent({ ...newEvent, event: e.target.value })}
                    size="small"
                    style={{ flexGrow: 1, marginRight: '16px' }}
                />
                <Button variant="outlined" onClick={handleAdd}>
                    Add
                </Button>
            </Box>
        </Box>
    );
};

// Main App component
function App() {
    const [interviews, setInterviews] = useState([]);
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [loading, setLoading] = useState(true);

    // Load interviews from IndexedDB on mount
    useEffect(() => {
        loadInterviews();
    }, []);

    const loadInterviews = async () => {
        setLoading(true);
        try {
            await interviewDB.init();
            const data = await interviewDB.getAllInterviews();
            setInterviews(data);
        } catch (error) {
            console.error('Failed to load interviews:', error);
            setSnackbar({ open: true, message: 'Failed to load interviews', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleOpenDialog = (interview = null) => {
        setSelectedInterview(interview);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedInterview(null);
    };

    const handleOpenDetail = (interview) => {
        setSelectedInterview(interview);
        setOpenDetail(true);
    };

    const handleCloseDetail = () => {
        setOpenDetail(false);
        setSelectedInterview(null);
    };

    const handleSaveInterview = async (interviewData) => {
        try {
            if (interviewData.id) {
                await interviewDB.saveInterview(interviewData);
                setInterviews(prev => prev.map(i => i.id === interviewData.id ? interviewData : i));
                setSnackbar({ open: true, message: 'Interview updated!', severity: 'success' });
            } else {
                const newId = Date.now().toString();
                const newInterview = { ...interviewData, id: newId };
                await interviewDB.saveInterview(newInterview);
                setInterviews(prev => [...prev, newInterview]);
                setSnackbar({ open: true, message: 'Interview added!', severity: 'success' });
            }
        } catch (error) {
            console.error('Failed to save interview:', error);
            setSnackbar({ open: true, message: 'Failed to save interview', severity: 'error' });
        }
        handleCloseDialog();
    };

    const handleDeleteInterview = async (id) => {
        if (!window.confirm('Are you sure you want to delete this interview?')) return;
        try {
            await interviewDB.deleteInterview(id);
            setInterviews(prev => prev.filter(i => i.id !== id));
            setSnackbar({ open: true, message: 'Interview deleted!', severity: 'warning' });
        } catch (error) {
            console.error('Failed to delete interview:', error);
            setSnackbar({ open: true, message: 'Failed to delete interview', severity: 'error' });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Interview form component
    const InterviewForm = ({ interview, onSave, onCancel }) => {
        const [formData, setFormData] = useState(interview || {
            company: '',
            position: '',
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            duration: '60',
            interviewer: '',
            status: 'upcoming',
            notes: '',
            reflection: '',
            timeline: [],
        });

        const handleChange = (field) => (event) => {
            setFormData({ ...formData, [field]: event.target.value });
        };

        const handleTimelineChange = (timeline) => {
            setFormData({ ...formData, timeline });
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(formData);
        };

        return (
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Company"
                            value={formData.company}
                            onChange={handleChange('company')}
                            fullWidth
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Position"
                            value={formData.position}
                            onChange={handleChange('position')}
                            fullWidth
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={handleChange('date')}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Time"
                            type="time"
                            value={formData.time}
                            onChange={handleChange('time')}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Duration (minutes)"
                            type="number"
                            value={formData.duration}
                            onChange={handleChange('duration')}
                            fullWidth
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Interviewer"
                            value={formData.interviewer}
                            onChange={handleChange('interviewer')}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={formData.status}
                                onChange={handleChange('status')}
                                label="Status"
                            >
                                <MenuItem value="upcoming">Upcoming</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="cancelled">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Notes"
                            value={formData.notes}
                            onChange={handleChange('notes')}
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="Record key points, questions asked, etc."
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Reflection /复盘"
                            value={formData.reflection}
                            onChange={handleChange('reflection')}
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="What went well? What could be improved? Lessons learned."
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TimelineEditor timeline={formData.timeline} onChange={handleTimelineChange} />
                    </Grid>
                </Grid>
                <DialogActions>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Save
                    </Button>
                </DialogActions>
            </form>
        );
    };

    // Interview Detail Component
    const InterviewDetail = ({ interview, onClose, onEdit, onDelete }) => {
        if (!interview) return null;

        return (
            <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    Interview Details
                    <IconButton
                        style={{ position: 'absolute', right: 8, top: 8 }}
                        onClick={onClose}
                    >
                        <span className="material-icons">close</span>
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Company</Typography>
                            <Typography variant="body1">{interview.company}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Position</Typography>
                            <Typography variant="body1">{interview.position}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Date & Time</Typography>
                            <Typography variant="body1">{interview.date} {interview.time}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Duration</Typography>
                            <Typography variant="body1">{interview.duration} minutes</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Interviewer</Typography>
                            <Typography variant="body1">{interview.interviewer || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                            <Chip
                                label={interview.status}
                                color={interview.status === 'completed' ? 'primary' : interview.status === 'upcoming' ? 'secondary' : 'default'}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">Notes</Typography>
                            <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                                {interview.notes || 'No notes'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">Reflection /复盘</Typography>
                            <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                                {interview.reflection || 'No reflection'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">Timeline</Typography>
                            {interview.timeline && interview.timeline.length > 0 ? (
                                <Timeline>
                                    {interview.timeline.map((item, index) => (
                                        <TimelineItem key={index}>
                                            <TimelineOppositeContent>
                                                <Typography color="textSecondary">{item.time}</Typography>
                                            </TimelineOppositeContent>
                                            <TimelineSeparator>
                                                <TimelineDot color="primary" />
                                                {index < interview.timeline.length - 1 && <TimelineConnector />}
                                            </TimelineSeparator>
                                            <TimelineContent>
                                                <Typography>{item.event}</Typography>
                                            </TimelineContent>
                                        </TimelineItem>
                                    ))}
                                </Timeline>
                            ) : (
                                <Typography>No timeline events recorded.</Typography>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Close</Button>
                    <Button onClick={() => { onClose(); onEdit(interview); }} color="primary">
                        Edit
                    </Button>
                    <Button onClick={() => { onClose(); onDelete(interview.id); }} color="secondary">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    // Interview list component
    const InterviewList = ({ interviews = [] }) => (
        <Grid container spacing={3}>
            {interviews.length === 0 ? (
                <Grid item xs={12}>
                    <Paper style={{ padding: '32px', textAlign: 'center' }}>
                        <Typography variant="h6" color="textSecondary">
                            No interviews found. Add your first interview!
                        </Typography>
                    </Paper>
                </Grid>
            ) : (
                interviews.map((interview) => (
                    <Grid item xs={12} sm={6} md={4} key={interview.id}>
                        <StyledCard>
                            <StyledCardContent>
                                <Typography variant="h6" gutterBottom>
                                    {interview.company}
                                </Typography>
                                <Typography color="textSecondary" gutterBottom>
                                    {interview.position}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Date:</strong> {interview.date} {interview.time}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Duration:</strong> {interview.duration} min
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Status:</strong> 
                                    <Chip
                                        label={interview.status}
                                        color={interview.status === 'completed' ? 'primary' : interview.status === 'upcoming' ? 'secondary' : 'default'}
                                        size="small"
                                        style={{ marginLeft: 8 }}
                                    />
                                </Typography>
                                <Divider style={{ margin: '16px 0' }} />
                                <Typography variant="body2" noWrap>
                                    {interview.notes || 'No notes'}
                                </Typography>
                            </StyledCardContent>
                            <CardActions>
                                <Button size="small" color="primary" onClick={() => handleOpenDialog(interview)}>
                                    Edit
                                </Button>
                                <Button size="small" color="secondary" onClick={() => handleDeleteInterview(interview.id)}>
                                    Delete
                                </Button>
                                <Button size="small" onClick={() => handleOpenDetail(interview)}>
                                    Details
                                </Button>
                            </CardActions>
                        </StyledCard>
                    </Grid>
                ))
            )}
        </Grid>
    );

    // Filter interviews based on tab
    const filteredInterviews = () => {
        switch (tabValue) {
            case 0: return interviews;
            case 1: return interviews.filter(i => i.status === 'upcoming');
            case 2: return interviews.filter(i => i.status === 'completed');
            default: return interviews;
        }
    };

    // Main render
    return (
        <ThemeProvider theme={theme}>
            <Global styles={css`
                body {
                    margin: 0;
                }
            `} />
            <AppBar position="static">
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="menu">
                        <span className="material-icons">menu</span>
                    </IconButton>
                    <Typography variant="h6" style={{ flexGrow: 1 }}>
                        Interview Tracker
                    </Typography>
                    <Button color="inherit" onClick={() => handleOpenDialog()}>
                        Add Interview
                    </Button>
                </Toolbar>
            </AppBar>

            <MainContainer maxWidth="lg">
                <PageTitle variant="h4">
                    Interview Records
                </PageTitle>
                
                <Paper square>
                    <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
                        <Tab label="All Interviews" />
                        <Tab label="Upcoming" />
                        <Tab label="Completed" />
                        <Tab label="Timeline" />
                    </Tabs>
                </Paper>

                <Box mt={4}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            {tabValue === 3 ? (
                                selectedInterview ? (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            Timeline for {selectedInterview.company} - {selectedInterview.position}
                                        </Typography>
                                        <Timeline>
                                            {selectedInterview.timeline && selectedInterview.timeline.map((item, index) => (
                                                <TimelineItem key={index}>
                                                    <TimelineOppositeContent>
                                                        <Typography color="textSecondary">{item.time}</Typography>
                                                    </TimelineOppositeContent>
                                                    <TimelineSeparator>
                                                        <TimelineDot color="primary" />
                                                        {index < selectedInterview.timeline.length - 1 && <TimelineConnector />}
                                                    </TimelineSeparator>
                                                    <TimelineContent>
                                                        <Typography>{item.event}</Typography>
                                                    </TimelineContent>
                                                </TimelineItem>
                                            ))}
                                        </Timeline>
                                        {selectedInterview.timeline && selectedInterview.timeline.length === 0 && (
                                            <Typography>No timeline events recorded.</Typography>
                                        )}
                                    </Box>
                                ) : (
                                    <Paper style={{ padding: '32px', textAlign: 'center' }}>
                                        <Typography variant="h6" color="textSecondary">
                                            Select an interview from the list to view its timeline.
                                        </Typography>
                                    </Paper>
                                )
                            ) : (
                                <InterviewList interviews={filteredInterviews()} />
                            )}
                        </>
                    )}
                </Box>

                {/* Add/Edit Dialog */}
                {openDialog && (
                    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                        <DialogTitle>
                            {selectedInterview ? 'Edit Interview' : 'Add New Interview'}
                        </DialogTitle>
                        <DialogContent>
                            <InterviewForm
                                interview={selectedInterview}
                                onSave={handleSaveInterview}
                                onCancel={handleCloseDialog}
                            />
                        </DialogContent>
                    </Dialog>
                )}

                {/* Detail Dialog */}
                {openDetail && selectedInterview && (
                    <InterviewDetail
                        interview={selectedInterview}
                        onClose={handleCloseDetail}
                        onEdit={handleOpenDialog}
                        onDelete={handleDeleteInterview}
                    />
                )}

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </MainContainer>
        </ThemeProvider>
    );
}

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));