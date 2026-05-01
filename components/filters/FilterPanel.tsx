'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  TextField, 
  Chip, 
  Slider, 
  IconButton, 
  Button,
  FormControlLabel,
  Switch,
  OutlinedInput,
} from '@mui/material';
import { 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Award, 
  Clock, 
  RotateCcw,
  Plus,
  Search as SearchIcon
} from 'lucide-react';
import { SalarySlider } from './SalarySlider';
import { JobType } from '@/types/dashboard';
import { 
  useQueryStates, 
  parseAsArrayOf, 
  parseAsString, 
  parseAsInteger
} from 'nuqs';
import { SavedSearch } from './SavedSearch';

const JOB_TYPES: JobType[] = ['full-time', 'part-time', 'contract', 'remote', 'hybrid'];

// Define URL state schema with nuqs
const filterSchema = {
  skills: parseAsArrayOf(parseAsString).withDefault([]),
  skillLogic: parseAsString.withDefault('OR'),
  location: parseAsString.withDefault(''),
  radius: parseAsInteger.withDefault(25),
  jobTypes: parseAsArrayOf(parseAsString).withDefault([]),
  salaryMin: parseAsInteger.withDefault(40000),
  salaryMax: parseAsInteger.withDefault(200000),
  aiScoreMin: parseAsInteger.withDefault(0),
  yearsExpMin: parseAsInteger.withDefault(0),
  yearsExpMax: parseAsInteger.withDefault(15),
  status: parseAsArrayOf(parseAsString).withDefault([]),
};

export const FilterPanel = () => {
  const [filters, setFilters] = useQueryStates(filterSchema, {
    shallow: false,
  });

  const [skillInput, setSkillInput] = useState('');

  const handleClearAll = () => {
    setFilters({
      skills: [],
      skillLogic: 'OR',
      location: '',
      radius: 25,
      jobTypes: [],
      salaryMin: 40000,
      salaryMax: 200000,
      aiScoreMin: 0,
      yearsExpMin: 0,
      yearsExpMax: 15,
      status: [],
    });
  };

  const addSkill = () => {
    if (skillInput.trim() && !filters.skills.includes(skillInput.trim())) {
      setFilters({ skills: [...filters.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFilters({ skills: filters.skills.filter((s) => s !== skill) });
  };

  const handleSalaryChange = (val: [number, number]) => {
    setFilters({ salaryMin: val[0], salaryMax: val[1] });
  };

  const handleYearsExpChange = (_: Event, val: number | number[]) => {
    const [min, max] = val as [number, number];
    setFilters({ yearsExpMin: min, yearsExpMax: max });
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: '100%', 
        maxWidth: 320, 
        p: 3, 
        borderRadius: 4, 
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 3.5,
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={800} sx={{ fontStyle: 'italic', letterSpacing: '-0.5px' }}>
          Refine Results
        </Typography>
        <Button 
          size="small" 
          onClick={handleClearAll}
          startIcon={<RotateCcw size={14} />}
          sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem' }}
        >
          Reset
        </Button>
      </Box>

      {/* Skills / Keywords */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Award size={18} color="#2563eb" />
            <Typography variant="subtitle2" fontWeight={700}>Must-have Skills</Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch 
                size="small" 
                checked={filters.skillLogic === 'AND'} 
                onChange={(e) => setFilters({ skillLogic: e.target.checked ? 'AND' : 'OR' })}
              />
            }
            label={
               <Typography variant="caption" fontWeight={700} color="primary">
                 {filters.skillLogic}
               </Typography>
            }
            labelPlacement="start"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <OutlinedInput
            size="small"
            placeholder="Add skill..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            sx={{ flex: 1, borderRadius: 2 }}
          />
          <IconButton 
            onClick={addSkill}
            sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, '&:hover': { bgcolor: 'grey.50' } }}
          >
            <Plus size={18} color="#2563eb" />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
          {filters.skills.map((skill) => (
            <Chip
              key={skill}
              label={skill}
              onDelete={() => removeSkill(skill)}
              size="small"
              sx={{ 
                bgcolor: 'blue.50', 
                color: 'blue.700', 
                fontWeight: 600,
                borderRadius: 1.5,
              }}
            />
          ))}
        </Box>
      </Box>

      <Divider />

      {/* Location */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MapPin size={18} color="#2563eb" />
          <Typography variant="subtitle2" fontWeight={700}>Geography</Typography>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="City, state, or remote"
          value={filters.location}
          onChange={(e) => setFilters({ location: e.target.value })}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
          Radius: {filters.radius}km
        </Typography>
        <Slider
          size="small"
          value={filters.radius}
          onChange={(_, val) => setFilters({ radius: val as number })}
          min={5}
          max={200}
          step={5}
          sx={{ color: '#2563eb' }}
        />
      </Box>

      <Divider />

      {/* Experience */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Clock size={18} color="#2563eb" />
          <Typography variant="subtitle2" fontWeight={700}>Experience Level</Typography>
        </Box>
        <Box sx={{ px: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>{filters.yearsExpMin}y</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>{filters.yearsExpMax}y+</Typography>
            </Box>
            <Slider
                size="small"
                value={[filters.yearsExpMin, filters.yearsExpMax]}
                onChange={handleYearsExpChange}
                min={0}
                max={30}
                sx={{ color: '#2563eb' }}
            />
        </Box>
      </Box>

      <Divider />

      {/* Compensation */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <DollarSign size={18} color="#2563eb" />
          <Typography variant="subtitle2" fontWeight={700}>Annual Salary</Typography>
        </Box>
        <SalarySlider 
          value={[filters.salaryMin, filters.salaryMax]} 
          onChange={handleSalaryChange}
        />
      </Box>

      <Divider />

      {/* AI Score */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SearchIcon size={18} color="#2563eb" />
          <Typography variant="subtitle2" fontWeight={700}>AI match score</Typography>
        </Box>
        <Slider
          size="small"
          value={filters.aiScoreMin}
          onChange={(_, val) => setFilters({ aiScoreMin: val as number })}
          min={0}
          max={100}
          sx={{ color: '#2563eb' }}
        />
      </Box>

      {/* Mode */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Briefcase size={18} color="#2563eb" />
          <Typography variant="subtitle2" fontWeight={700}>Job Mode</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {JOB_TYPES.map((type) => (
            <Chip
              key={type}
              label={type}
              onClick={() => {
                const newTypes = filters.jobTypes.includes(type)
                  ? filters.jobTypes.filter(t => t !== type)
                  : [...filters.jobTypes, type];
                setFilters({ jobTypes: newTypes });
              }}
              variant={filters.jobTypes.includes(type) ? 'filled' : 'outlined'}
              color={filters.jobTypes.includes(type) ? 'primary' : 'default'}
              size="small"
              sx={{ textTransform: 'capitalize', borderRadius: 2, fontWeight: 600 }}
            />
          ))}
        </Box>
      </Box>

      <Divider />

      {/* Saved Searches */}
      <SavedSearch 
        currentFilters={{
          skills: filters.skills,
          skillLogic: filters.skillLogic as any,
          location: filters.location,
          radius: filters.radius,
          jobTypes: filters.jobTypes as any,
          salary: { min: filters.salaryMin, max: filters.salaryMax },
          aiScoreMin: filters.aiScoreMin,
          yearsExp: { min: filters.yearsExpMin, max: filters.yearsExpMax },
          status: filters.status,
        }} 
        onApply={(f) => {
          setFilters({
            skills: f.skills,
            skillLogic: f.skillLogic,
            location: f.location,
            radius: f.radius,
            jobTypes: f.jobTypes,
            salaryMin: f.salary.min,
            salaryMax: f.salary.max,
            aiScoreMin: f.aiScoreMin,
            yearsExpMin: f.yearsExp.min,
            yearsExpMax: f.yearsExp.max,
            status: f.status,
          });
        }}
      />
    </Paper>
  );
};
